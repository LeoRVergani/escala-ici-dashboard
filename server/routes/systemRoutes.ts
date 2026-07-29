import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { getFirebaseRuntimeStatus } from '../config/firebase.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { sendOk } from '../app/responses.js';

export function createSystemRoutes(config: AppConfig, packageInfo: PackageInfo) {
  const router = Router();

  router.get('/health', (_req, res) => {
    sendOk(res, {
      status: 'ok',
      version: packageInfo.version,
      environment: config.NODE_ENV,
      backend: {
        name: 'express',
        runtime: `node ${process.version}`,
      },
      firebase: getFirebaseRuntimeStatus(config),
      officialPublicationEnabled: config.ALLOW_OFFICIAL_FIRESTORE_WRITE,
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/config/public', (_req, res) => {
    sendOk(res, {
      publicName: 'Dashboard Escala ICI',
      version: packageInfo.version,
      projectId: config.FIREBASE_PROJECT_ID,
      officialWorkspaceId: config.OFFICIAL_WORKSPACE_ID,
      features: {
        devLogin: config.DEV_AUTH_ENABLED && config.NODE_ENV !== 'production',
        msalPrepared: Boolean(config.MSAL_TENANT_ID && config.MSAL_CLIENT_ID),
        officialPublication: config.ALLOW_OFFICIAL_FIRESTORE_WRITE,
      },
      devLoginAllowed: config.DEV_AUTH_ENABLED && config.NODE_ENV !== 'production',
      officialPublicationEnabled: config.ALLOW_OFFICIAL_FIRESTORE_WRITE,
    });
  });

  router.get('/version', (_req, res) => {
    sendOk(res, packageInfo);
  });

  return router;
}
