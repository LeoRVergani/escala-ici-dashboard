/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { resetAuditOutboxStore } from '../application/auditOutboxStore.js';
import { resetChangeRequestStore, seedChangeRequest } from '../application/changeRequestStore.js';
import { SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '../domain/organizationSeed.js';

const packageInfo: PackageInfo = { name: 'escala-ici-dashboard', version: '9.9.9-test' };

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  resetAuditOutboxStore();
  resetChangeRequestStore();
  const config = loadConfig({
    NODE_ENV: 'development',
    PORT: '3001',
    CORS_ORIGINS: 'http://localhost:5173',
    FIREBASE_PROJECT_ID: 'escala-ici-dev',
    OFFICIAL_WORKSPACE_ID: 'ici-dev',
    DEMO_WORKSPACE_ID: 'demo-v1',
    ALLOW_OFFICIAL_FIRESTORE_WRITE: 'false',
    DEV_AUTH_ENABLED: 'true',
    LOG_LEVEL: 'silent',
  });
  const server = createServer(createApp({ config, packageInfo }));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Test server did not start.');
  }
  try {
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function session(baseUrl: string, login: 'claudio' | 'lvergani'): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/dev-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login }),
  });
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected Set-Cookie.');
  return setCookie.split(';')[0]!;
}

function createRequest(teamId = SEED_TEAM_SOC_ID) {
  return seedChangeRequest({
    workspaceId: 'ici-dev',
    requesterMemberId: 'member-1',
    requesterTeamId: teamId,
    assignedManagerMemberId: 'manager-1',
    schedulePeriodId: '2026-07',
    assignmentId: 'assignment-1',
    requestType: 'SWAP',
    status: 'PENDING',
    reason: 'Troca de plantão',
    publicationRevision: 1,
  });
}

describe('change requests and admin routes', () => {
  it('lists and approves a team change request, recording audit and outbox', async () => {
    await withServer(async (baseUrl) => {
      const request = createRequest();
      const cookie = await session(baseUrl, 'claudio');

      const list = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/change-requests`, { headers: { cookie } });
      const listBody = await list.json() as { data: Array<{ id: string; status: string }> };
      expect(listBody.data).toEqual([expect.objectContaining({ id: request.id, status: 'PENDING' })]);

      const approve = await fetch(`${baseUrl}/api/change-requests/${request.id}/approve`, {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'Aprovado no teste' }),
      });
      const approveBody = await approve.json() as { data: { status: string; resolutionNote: string } };
      expect(approveBody.data.status).toBe('APPROVED');
      expect(approveBody.data.resolutionNote).toBe('Aprovado no teste');

      const adminCookie = await session(baseUrl, 'lvergani');
      const audit = await fetch(`${baseUrl}/api/admin/audit-events`, { headers: { cookie: adminCookie } });
      const auditBody = await audit.json() as {
        data: { auditEvents: Array<{ type: string }>; outboxEvents: Array<{ type: string }> };
      };
      expect(auditBody.data.auditEvents.map((event) => event.type)).toContain('CHANGE_REQUEST_APPROVED');
      expect(auditBody.data.outboxEvents.map((event) => event.type)).toContain('CHANGE_REQUEST_APPROVED');
    });
  });

  it('rejects unauthorized team change request reads', async () => {
    await withServer(async (baseUrl) => {
      createRequest(SEED_TEAM_NOC_ID);
      const cookie = await session(baseUrl, 'claudio');
      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_NOC_ID}/change-requests`, {
        headers: { cookie },
      });
      expect(response.status).toBe(403);
    });
  });

  it('allows admin to inspect users and teams, while manager cannot inspect admin data', async () => {
    await withServer(async (baseUrl) => {
      const adminCookie = await session(baseUrl, 'lvergani');
      const users = await fetch(`${baseUrl}/api/admin/users`, { headers: { cookie: adminCookie } });
      const usersBody = await users.json() as { data: Array<{ login: string }> };
      expect(users.status).toBe(200);
      expect(usersBody.data.map((user) => user.login).sort()).toEqual(['claudio', 'lvergani']);

      const managerCookie = await session(baseUrl, 'claudio');
      const denied = await fetch(`${baseUrl}/api/admin/users`, { headers: { cookie: managerCookie } });
      expect(denied.status).toBe(403);
    });
  });

  it('records rejected requests with the proper outbox event', async () => {
    await withServer(async (baseUrl) => {
      const request = createRequest();
      const cookie = await session(baseUrl, 'claudio');
      const reject = await fetch(`${baseUrl}/api/change-requests/${request.id}/reject`, {
        method: 'POST',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'Sem cobertura' }),
      });
      expect(reject.status).toBe(200);

      const adminCookie = await session(baseUrl, 'lvergani');
      const audit = await fetch(`${baseUrl}/api/admin/audit-events`, { headers: { cookie: adminCookie } });
      const auditBody = await audit.json() as { data: { outboxEvents: Array<{ type: string }> } };
      expect(auditBody.data.outboxEvents.map((event) => event.type)).toContain('CHANGE_REQUEST_REJECTED');
    });
  });
});
