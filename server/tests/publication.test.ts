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
  id: 'member-pub-1',
  teamId: SEED_TEAM_SOC_ID,
  name: 'Ana Souza',
  corporateLogin: 'ana.souza',
  active: true,
};

async function withServer<T>(allowWrite: boolean, fn: (baseUrl: string) => Promise<T>): Promise<T> {
  resetPublicationStore();
  const config = loadConfig({
    NODE_ENV: 'development',
    PORT: '3001',
    CORS_ORIGINS: 'http://localhost:5173',
    FIREBASE_PROJECT_ID: 'escala-ici-dev',
    OFFICIAL_WORKSPACE_ID: 'ici-dev',
    DEMO_WORKSPACE_ID: 'demo-v1',
    ALLOW_OFFICIAL_FIRESTORE_WRITE: allowWrite ? 'true' : 'false',
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
    id: 'schedule-publication-1',
    sectorId: SEED_AREA_COSI_ID,
    teamId: SEED_TEAM_SOC_ID,
    periodStart: '2026-07-01',
    periodEnd: '2026-07-10',
    status: 'DRAFT',
    members: [member.id],
    assignments: [
      {
        scheduleId: 'schedule-publication-1',
        memberId: member.id,
        date: '2026-07-01',
        shiftCode: 'manha',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

async function publish(baseUrl: string, cookie: string, input?: Partial<Record<string, unknown>>) {
  return fetch(`${baseUrl}/api/teams/${SEED_TEAM_SOC_ID}/schedules/publish`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      schedule: schedule(),
      members: [member],
      expectedActiveRevision: 0,
      idempotencyKey: 'idem-publication-0001',
      sourceHash: 'source-hash',
      packageHash: 'package-hash',
      confirmation: true,
      ...input,
    }),
  });
}

describe('publication endpoint', () => {
  it('validates but does not write when official writes are disabled', async () => {
    await withServer(false, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const response = await publish(baseUrl, cookie);
      const body = await response.json() as { data: { status: string; writable: boolean; activeRevision: number } };

      expect(response.status).toBe(200);
      expect(body.data.status).toBe('official-write-disabled');
      expect(body.data.writable).toBe(false);
      expect(body.data.activeRevision).toBe(0);
    });
  });

  it('publishes revision 1 and promotes the active pointer when writes are enabled for tests', async () => {
    await withServer(true, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const response = await publish(baseUrl, cookie, { idempotencyKey: 'idem-publication-0002' });
      const body = await response.json() as {
        data: { status: string; revision: number; activeRevision: number; record: { workspaceId: string; previousRevision: number } };
      };

      expect(response.status).toBe(200);
      expect(body.data.status).toBe('published');
      expect(body.data.revision).toBe(1);
      expect(body.data.activeRevision).toBe(1);
      expect(body.data.record.workspaceId).toBe('ici-dev');
      expect(body.data.record.previousRevision).toBe(0);
    });
  });

  it('returns the same revision for a repeated idempotency key', async () => {
    await withServer(true, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const first = await publish(baseUrl, cookie, { idempotencyKey: 'idem-publication-0003' });
      const second = await publish(baseUrl, cookie, { idempotencyKey: 'idem-publication-0003' });
      const firstBody = await first.json() as { data: { revision: number } };
      const secondBody = await second.json() as { data: { revision: number } };

      expect(second.status).toBe(200);
      expect(secondBody.data.revision).toBe(firstBody.data.revision);
    });
  });

  it('rejects stale expectedActiveRevision values', async () => {
    await withServer(true, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      await publish(baseUrl, cookie, { idempotencyKey: 'idem-publication-0004' });
      const response = await publish(baseUrl, cookie, {
        idempotencyKey: 'idem-publication-0005',
        expectedActiveRevision: 0,
      });
      const body = await response.json() as { error: { code: string; details: { activeRevision: number } } };

      expect(response.status).toBe(409);
      expect(body.error.code).toBe('PUBLICATION_REVISION_CONFLICT');
      expect(body.error.details.activeRevision).toBeGreaterThan(0);
    });
  });
});
