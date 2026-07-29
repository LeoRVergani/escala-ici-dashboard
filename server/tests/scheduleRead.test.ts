/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { resetPublicationStore } from '../application/publicationStore.js';
import { SEED_AREA_COSI_ID, SEED_TEAM_SOC_ID } from '../domain/organizationSeed.js';
import type { Member } from '../../src/domain/member.js';
import type { Schedule } from '../../src/domain/schedule.js';

const packageInfo: PackageInfo = { name: 'escala-ici-dashboard', version: '9.9.9-test' };
const member: Member = {
  id: 'member-read-1',
  teamId: SEED_TEAM_SOC_ID,
  name: 'Ana Souza',
  corporateLogin: 'ana.souza',
  active: true,
};

async function withServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  resetPublicationStore();
  const config = loadConfig({
    NODE_ENV: 'development',
    PORT: '3001',
    CORS_ORIGINS: 'http://localhost:5173',
    FIREBASE_PROJECT_ID: 'escala-ici-dev',
    OFFICIAL_WORKSPACE_ID: 'ici-dev',
    DEMO_WORKSPACE_ID: 'demo-v1',
    ALLOW_OFFICIAL_FIRESTORE_WRITE: 'true',
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

async function createDevSession(baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/dev-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login: 'claudio' }),
  });
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected Set-Cookie.');
  return setCookie.split(';')[0]!;
}

function schedule(): Schedule {
  const now = '2026-07-29T12:00:00.000Z';
  return {
    id: 'schedule-read-1',
    sectorId: SEED_AREA_COSI_ID,
    teamId: SEED_TEAM_SOC_ID,
    periodStart: '2026-07-01',
    periodEnd: '2026-07-10',
    status: 'DRAFT',
    members: [member.id],
    assignments: [
      { scheduleId: 'schedule-read-1', memberId: member.id, date: '2026-07-01', shiftCode: 'manha' },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

async function publish(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/publish`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      schedule: schedule(),
      members: [member],
      expectedActiveRevision: 0,
      idempotencyKey: 'idem-schedule-read',
      sourceHash: 'source-hash',
      packageHash: 'package-hash',
      confirmation: true,
    }),
  });
  expect(response.status).toBe(200);
}

describe('schedule read endpoints', () => {
  it('returns empty publication status before any publish', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/publication-status`, {
        headers: { cookie },
      });
      const body = await response.json() as { data: { activeRevision: number; hasActivePublication: boolean } };

      expect(body.data.activeRevision).toBe(0);
      expect(body.data.hasActivePublication).toBe(false);
    });
  });

  it('reads current, history and a specific revision after publication', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      await publish(baseUrl, cookie);

      const current = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/current`, { headers: { cookie } });
      const currentBody = await current.json() as { data: { revision: number; schedule: Schedule } };
      expect(currentBody.data.revision).toBe(1);
      expect(currentBody.data.schedule.assignments).toHaveLength(1);

      const history = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/history`, { headers: { cookie } });
      const historyBody = await history.json() as { data: Array<{ revision: number; packageHash: string }> };
      expect(historyBody.data).toHaveLength(1);
      expect(historyBody.data[0]).toMatchObject({ revision: 1, packageHash: 'package-hash' });

      const revision = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/1`, { headers: { cookie } });
      const revisionBody = await revision.json() as { data: { revision: number; members: Member[] } };
      expect(revisionBody.data.revision).toBe(1);
      expect(revisionBody.data.members[0].corporateLogin).toBe('ana.souza');
    });
  });

  it('exports a published revision as XLSX', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      await publish(baseUrl, cookie);

      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/1/export.xlsx`, {
        headers: { cookie },
      });
      const bytes = new Uint8Array(await response.arrayBuffer());

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('spreadsheetml.sheet');
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
    });
  });
});
