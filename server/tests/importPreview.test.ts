/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '../domain/organizationSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    IMPORT_MAX_FILE_SIZE_BYTES: String(10 * 1024 * 1024),
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

function fixture(name: string): Uint8Array {
  return readFileSync(path.join(__dirname, '../../src/lib/parser/fixtures', name));
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

async function postPreview(baseUrl: string, cookie: string, file: Uint8Array, name: string, teamId: string) {
  const form = new FormData();
  form.set('teamId', teamId);
  form.set('file', new Blob([file]), name);
  return fetch(`${baseUrl}/api/imports/preview`, {
    method: 'POST',
    headers: { cookie },
    body: form,
  });
}

describe('POST /api/imports/preview', () => {
  it('rejects unauthenticated uploads', async () => {
    await withServer(async (baseUrl) => {
      const response = await postPreview(
        baseUrl,
        '',
        fixture('soc-controle-julho-ficticio.xlsx'),
        'soc-controle-julho-ficticio.xlsx',
        SEED_TEAM_SOC_ID,
      );
      expect(response.status).toBe(401);
    });
  });

  it('previews a synthetic SOC spreadsheet with deterministic hashes', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const bytes = fixture('soc-controle-julho-ficticio.xlsx');
      const first = await postPreview(baseUrl, cookie, bytes, 'soc-controle-julho-ficticio.xlsx', SEED_TEAM_SOC_ID);
      const second = await postPreview(baseUrl, cookie, bytes, 'soc-controle-julho-ficticio.xlsx', SEED_TEAM_SOC_ID);
      const firstBody = await first.json() as {
        data: {
          file: { name: string };
          hash: string;
          normalizedPackageHash: string;
          team: { possibleDivergence: boolean };
          summary: { collaborators: number; shifts: number; logins: number };
          issues: { blockingErrors: string[] };
        };
      };
      const secondBody = await second.json() as { data: { hash: string; normalizedPackageHash: string } };

      expect(first.status).toBe(200);
      expect(firstBody.data.file.name).toBe('soc-controle-julho-ficticio.xlsx');
      expect(firstBody.data.summary.collaborators).toBeGreaterThan(0);
      expect(firstBody.data.summary.logins).toBeGreaterThan(0);
      expect(firstBody.data.summary.shifts).toBeGreaterThan(0);
      expect(firstBody.data.issues.blockingErrors).toEqual([]);
      expect(firstBody.data.team.possibleDivergence).toBe(false);
      expect(secondBody.data.hash).toBe(firstBody.data.hash);
      expect(secondBody.data.normalizedPackageHash).toBe(firstBody.data.normalizedPackageHash);
    });
  });

  it('rejects an unauthorized team chosen by the browser', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await postPreview(
        baseUrl,
        cookie,
        fixture('soc-controle-julho-ficticio.xlsx'),
        'soc-controle-julho-ficticio.xlsx',
        SEED_TEAM_NOC_ID,
      );
      const body = await response.json() as { error: { code: string } };

      expect(response.status).toBe(403);
      expect(body.error.code).toBe('TEAM_FORBIDDEN');
    });
  });

  it('rejects files whose extension and signature do not match', async () => {
    await withServer(async (baseUrl) => {
      const cookie = await createDevSession(baseUrl, 'claudio');
      const response = await postPreview(
        baseUrl,
        cookie,
        new TextEncoder().encode('not a spreadsheet'),
        'fake.xlsx',
        SEED_TEAM_SOC_ID,
      );
      const body = await response.json() as { error: { code: string } };

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('IMPORT_SIGNATURE_INVALID');
    });
  });
});
