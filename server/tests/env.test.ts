/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { loadConfig } from '../config/env.js';

describe('loadConfig', () => {
  it('parses safe defaults and boolean flags', () => {
    const config = loadConfig({
      PORT: '3999',
      CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
      ALLOW_OFFICIAL_FIRESTORE_WRITE: 'false',
      DEV_AUTH_ENABLED: 'true',
    });

    expect(config.PORT).toBe(3999);
    expect(config.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    expect(config.ALLOW_OFFICIAL_FIRESTORE_WRITE).toBe(false);
    expect(config.DEV_AUTH_ENABLED).toBe(true);
  });

  it('rejects invalid ports through schema validation', () => {
    expect(() => loadConfig({ PORT: '-1' })).toThrow(ZodError);
  });
});
