/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig, type AppConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import {
  SEED_AREA_COSI_ID,
  SEED_TEAM_NOC_ID,
  SEED_TEAM_PLANTAO_COSI_ID,
  SEED_TEAM_SOC_ID,
} from '../domain/organizationSeed.js';

const packageInfo: PackageInfo = {
  name: 'escala-ici-dashboard',
  version: '9.9.9-test',
};

async function withServer<T>(
  overrides: Partial<NodeJS.ProcessEnv>,
  fn: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const config: AppConfig = loadConfig({
    NODE_ENV: 'development',
    PORT: '3001',
    CORS_ORIGINS: 'http://localhost:5173',
    FIREBASE_PROJECT_ID: 'escala-ici-dev',
    OFFICIAL_WORKSPACE_ID: 'ici-dev',
    DEMO_WORKSPACE_ID: 'demo-v1',
    ALLOW_OFFICIAL_FIRESTORE_WRITE: 'false',
    DEV_AUTH_ENABLED: 'true',
    LOG_LEVEL: 'silent',
    ...overrides,
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

function firstCookie(response: Response): string {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected Set-Cookie header.');
  return setCookie.split(';')[0]!;
}

async function createDevSession(baseUrl: string, login = 'claudio'): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/dev-session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login }),
  });
  expect(response.status).toBe(200);
  return firstCookie(response);
}

describe('auth and RBAC', () => {
  it('rejects unauthenticated organization reads', async () => {
    await withServer({}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/me`);
      const body = await response.json() as { ok: boolean; error: { code: string } };

      expect(response.status).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  it('creates a dev session for Claudio without accepting arbitrary roles', async () => {
    await withServer({}, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await fetch(`${baseUrl}/api/me`, { headers: { cookie } });
      const body = await response.json() as {
        data: { user: { login: string; roles: string[] }; authorization: { teamIds: string[] } };
      };

      expect(body.data.user.login).toBe('claudio');
      expect(body.data.user.roles).toEqual(['MANAGER']);
      expect(body.data.authorization.teamIds).toEqual([SEED_TEAM_SOC_ID, SEED_TEAM_PLANTAO_COSI_ID]);
    });
  });

  it('allows Claudio to read COSI and his authorized teams only', async () => {
    await withServer({}, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const areasResponse = await fetch(`${baseUrl}/api/areas`, { headers: { cookie } });
      const areasBody = await areasResponse.json() as { data: Array<{ id: string; code: string }> };
      expect(areasBody.data).toEqual([{ id: SEED_AREA_COSI_ID, code: 'COSI', name: 'Coordenadoria de Segurança da Informação', organizationId: expect.any(String), active: true }]);

      const teamsResponse = await fetch(`${baseUrl}/api/areas/${SEED_AREA_COSI_ID}/teams`, {
        headers: { cookie },
      });
      const teamsBody = await teamsResponse.json() as { data: Array<{ id: string; name: string }> };
      expect(teamsBody.data.map((team) => team.id).sort()).toEqual([
        SEED_TEAM_SOC_ID,
        SEED_TEAM_PLANTAO_COSI_ID,
      ]);
      expect(teamsBody.data.map((team) => team.name)).toContain('SOC — Escala 6x1');
      expect(teamsBody.data.map((team) => team.name)).not.toContain('NOC — Escala 6x1');
    });
  });

  it('denies Claudio direct access to NOC', async () => {
    await withServer({}, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await fetch(`${baseUrl}/api/teams/${SEED_TEAM_NOC_ID}`, { headers: { cookie } });
      const body = await response.json() as { ok: boolean; error: { code: string } };

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('TEAM_FORBIDDEN');
    });
  });

  it('allows lvergani admin/developer to read SOC, NOC and Plantão separately', async () => {
    await withServer({}, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'lvergani');
      const teamsResponse = await fetch(`${baseUrl}/api/areas/${SEED_AREA_COSI_ID}/teams`, {
        headers: { cookie },
      });
      const teamsBody = await teamsResponse.json() as { data: Array<{ id: string; name: string }> };

      expect(teamsBody.data.map((team) => team.id).sort()).toEqual([
        SEED_TEAM_SOC_ID,
        SEED_TEAM_NOC_ID,
        SEED_TEAM_PLANTAO_COSI_ID,
      ]);
      expect(new Set(teamsBody.data.map((team) => team.name)).size).toBe(3);
    });
  });

  it('refuses dev login when the flag is disabled', async () => {
    await withServer({ DEV_AUTH_ENABLED: 'false' }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/dev-session`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'claudio' }),
      });
      const body = await response.json() as { ok: boolean; error: { code: string } };

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('DEV_AUTH_DISABLED');
    });
  });

  it('clears the session on logout', async () => {
    await withServer({}, async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { cookie },
      });
      expect(logoutResponse.status).toBe(200);

      const response = await fetch(`${baseUrl}/api/me`, { headers: { cookie } });
      expect(response.status).toBe(401);
    });
  });
});
