/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { SEED_AREA_COSI_ID, SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '../domain/organizationSeed.js';
import type { Schedule } from '../../src/domain/schedule.js';

const packageInfo: PackageInfo = { name: 'escala-ici-dashboard', version: '9.9.9-test' };

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
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

async function createDevSession(baseUrl: string, login = 'claudio'): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/dev-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login }),
  });
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected Set-Cookie.');
  return setCookie.split(';')[0]!;
}

function schedule(teamId = SEED_TEAM_SOC_ID): Schedule {
  const now = '2026-07-29T12:00:00.000Z';
  return {
    id: `draft-${teamId}`,
    sectorId: SEED_AREA_COSI_ID,
    teamId,
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    status: 'DRAFT',
    members: ['member-1'],
    assignments: [
      {
        scheduleId: `draft-${teamId}`,
        memberId: 'member-1',
        date: '2026-07-01',
        shiftCode: 'manha',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

describe('draft routes', () => {
  it('saves and resumes the current team draft', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const saveResponse = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        method: 'PUT',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ schedule: schedule(), sourceHash: 'source-1', expectedActiveRevision: 3 }),
      });
      const saveBody = await saveResponse.json() as {
        data: { schedule: Schedule; sourceHash: string; expectedActiveRevision: number; savedBy: { login: string } };
      };
      expect(saveResponse.status).toBe(200);
      expect(saveBody.data.schedule.status).toBe('DRAFT');
      expect(saveBody.data.sourceHash).toBe('source-1');
      expect(saveBody.data.expectedActiveRevision).toBe(3);
      expect(saveBody.data.savedBy.login).toBe('claudio');

      const getResponse = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        headers: { cookie },
      });
      const getBody = await getResponse.json() as { data: { schedule: Schedule } };
      expect(getBody.data.schedule.assignments).toHaveLength(1);
    });
  });

  it('rejects draft contamination across teams', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        method: 'PUT',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ schedule: schedule(SEED_TEAM_NOC_ID) }),
      });
      const body = await response.json() as { error: { code: string } };
      expect(response.status).toBe(400);
      expect(body.error.code).toBe('DRAFT_TEAM_MISMATCH');
    });
  });

  it('enforces RBAC for unauthorized draft reads', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_NOC_ID}/drafts/current`, {
        headers: { cookie },
      });
      expect(response.status).toBe(403);
    });
  });

  it('deletes the current draft explicitly', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        method: 'PUT',
        headers: { cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ schedule: schedule() }),
      });
      const deleteResponse = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        method: 'DELETE',
        headers: { cookie },
      });
      expect(deleteResponse.status).toBe(200);

      const getResponse = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/drafts/current`, {
        headers: { cookie },
      });
      const getBody = await getResponse.json() as { data: null };
      expect(getBody.data).toBeNull();
    });
  });
});
