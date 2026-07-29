/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { SEED_AREA_COSI_ID, SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '../domain/organizationSeed.js';
import type { Member } from '../../src/domain/member.js';
import type { Schedule } from '../../src/domain/schedule.js';

const packageInfo: PackageInfo = { name: 'escala-ici-dashboard', version: '9.9.9-test' };
const member: Member = {
  id: 'member-1',
  teamId: SEED_TEAM_SOC_ID,
  name: 'Ana Souza',
  corporateLogin: 'ana.souza',
  active: true,
};

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

function schedule(assignments: Schedule['assignments'] = []): Schedule {
  const now = '2026-07-29T12:00:00.000Z';
  return {
    id: 'schedule-1',
    sectorId: SEED_AREA_COSI_ID,
    teamId: SEED_TEAM_SOC_ID,
    periodStart: '2026-07-01',
    periodEnd: '2026-07-10',
    status: 'DRAFT',
    members: [member.id],
    assignments,
    createdAt: now,
    updatedAt: now,
  };
}

async function validate(baseUrl: string, cookie: string, body: unknown, teamId = SEED_TEAM_SOC_ID) {
  return fetch(`${baseUrl}/api/teams/${teamId}/schedules/validate`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('schedule validation endpoint', () => {
  it('returns blocking errors for an empty package', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const response = await validate(baseUrl, cookie, { schedule: schedule(), members: [] });
      const body = await response.json() as { data: { valid: boolean; blockingErrors: unknown[] } };

      expect(response.status).toBe(200);
      expect(body.data.valid).toBe(false);
      expect(body.data.blockingErrors.length).toBeGreaterThan(0);
    });
  });

  it('returns typed critical 6x1 alerts with deterministic hashes', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const assignments: Schedule['assignments'] = [];
      for (const day of ['01', '02', '03', '04', '05', '06', '07']) {
        assignments.push({
          scheduleId: 'schedule-1',
          memberId: member.id,
          date: `2026-07-${day}`,
          shiftCode: 'manha',
        });
      }
      const payload = { schedule: schedule(assignments), members: [member], sourceHash: 'abc' };
      const first = await validate(baseUrl, cookie, payload);
      const second = await validate(baseUrl, cookie, payload);
      const firstBody = await first.json() as {
        data: {
          valid: boolean;
          criticalWarnings: Array<{ ruleCode: string; severity: string; dedupKey: string; date?: string }>;
          normalizedPackageHash: string;
        };
      };
      const secondBody = await second.json() as { data: { normalizedPackageHash: string } };

      expect(firstBody.data.valid).toBe(true);
      expect(firstBody.data.criticalWarnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleCode: 'sixByOne',
            severity: 'critico',
            date: '2026-07-07',
          }),
        ]),
      );
      expect(firstBody.data.criticalWarnings.every((alert) => alert.dedupKey)).toBe(true);
      expect(secondBody.data.normalizedPackageHash).toBe(firstBody.data.normalizedPackageHash);
    });
  });

  it('rejects validation for unauthorized teams', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const response = await validate(baseUrl, cookie, { schedule: schedule(), members: [member] }, SEED_TEAM_NOC_ID);

      expect(response.status).toBe(403);
    });
  });

  it('rejects team mismatches inside the package', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl);
      const mismatched = { ...schedule(), teamId: SEED_TEAM_NOC_ID };
      const response = await validate(baseUrl, cookie, { schedule: mismatched, members: [member] });
      const body = await response.json() as { error: { code: string } };

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_TEAM_MISMATCH');
    });
  });
});
