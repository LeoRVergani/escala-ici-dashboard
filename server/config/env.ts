import { z } from 'zod';

const booleanFromEnv = z
  .string()
  .optional()
  .transform((value) => value === 'true');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  FIREBASE_PROJECT_ID: z.string().default('escala-ici-dev'),
  OFFICIAL_WORKSPACE_ID: z.string().default('ici-dev'),
  DEMO_WORKSPACE_ID: z.string().default('demo-v1'),
  ALLOW_OFFICIAL_FIRESTORE_WRITE: booleanFromEnv.default(false),
  DEV_AUTH_ENABLED: booleanFromEnv.default(true),
  LOG_LEVEL: z.string().default('info'),
  IMPORT_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MSAL_TENANT_ID: z.string().optional().default(''),
  MSAL_CLIENT_ID: z.string().optional().default(''),
  MSAL_AUDIENCE: z.string().optional().default(''),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(source);
}
