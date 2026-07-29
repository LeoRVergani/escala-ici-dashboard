/**
 * @vitest-environment node
 */
import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../app/createApp.js';
import { loadConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';

const packageInfo: PackageInfo = {
  name: 'escala-ici-dashboard',
  version: '9.9.9-test',
};

interface TestEnvelope {
  ok: boolean;
  requestId: string;
  data: {
    version?: string;
    publicName?: string;
    officialWorkspaceId?: string;
    devLoginAllowed?: boolean;
    officialPublicationEnabled?: boolean;
    firebase?: {
      projectId: string;
      configured: boolean;
      emulator: boolean;
    };
  };
  error: {
    code: string;
  };
}

async function withServer<T>(
  corsOrigins: string,
  fn: (baseUrl: string) => Promise<T>,
): Promise<T> {
  const config = loadConfig({
    NODE_ENV: 'test',
    PORT: '3001',
    CORS_ORIGINS: corsOrigins,
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

afterEach(() => {
  delete process.env.FIRESTORE_EMULATOR_HOST;
});

describe('system routes', () => {
  it('returns health without secrets', async () => {
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { origin: 'http://localhost:5173' },
      });
      const body = (await response.json()) as TestEnvelope;

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.requestId).toEqual(expect.any(String));
      expect(body.data.version).toBe('9.9.9-test');
      const firebase = body.data.firebase;
      if (!firebase) throw new Error('Expected Firebase health data.');
      expect(firebase.projectId).toBe('escala-ici-dev');
      expect(body.data.officialPublicationEnabled).toBe(false);
      expect(JSON.stringify(body)).not.toContain('service-account');
      expect(JSON.stringify(body)).not.toContain('Bearer');
    });
  });

  it('returns public config only', async () => {
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/config/public`);
      const body = (await response.json()) as TestEnvelope;

      expect(response.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.data.publicName).toBe('Dashboard Escala ICI');
      expect(body.data.officialWorkspaceId).toBe('ici-dev');
      expect(body.data.devLoginAllowed).toBe(true);
      expect(body.data).not.toHaveProperty('GOOGLE_APPLICATION_CREDENTIALS');
    });
  });

  it('returns package version from the shared package source', async () => {
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/version`);
      const body = (await response.json()) as TestEnvelope;

      expect(response.status).toBe(200);
      expect(body.data).toEqual(packageInfo);
    });
  });

  it('rejects origins outside the allowlist', async () => {
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { origin: 'http://malicious.example' },
      });
      const body = (await response.json()) as TestEnvelope;

      expect(response.status).toBe(403);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('CORS_ORIGIN_DENIED');
    });
  });

  it('returns typed not found errors', async () => {
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/does-not-exist`);
      const body = (await response.json()) as TestEnvelope;

      expect(response.status).toBe(404);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.requestId).toEqual(expect.any(String));
    });
  });

  it('marks Firebase as configured when the emulator is active', async () => {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    await withServer('http://localhost:5173', async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/health`);
      const body = (await response.json()) as TestEnvelope;

      const firebase = body.data.firebase;
      if (!firebase) throw new Error('Expected Firebase health data.');
      expect(firebase.configured).toBe(true);
      expect(firebase.emulator).toBe(true);
    });
  });
});
