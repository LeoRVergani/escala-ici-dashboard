import cors from 'cors';
import express from 'express';
import pino from 'pino';
import type { AppConfig } from '../config/env.js';
import type { PackageInfo } from '../config/packageInfo.js';
import { AppError } from '../domain/appError.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { httpLogger } from '../middleware/httpLogger.js';
import { notFoundMiddleware } from '../middleware/notFound.js';
import { attachSession } from '../middleware/requireAuth.js';
import { requestIdMiddleware } from '../middleware/requestId.js';
import { createAuthRoutes } from '../routes/authRoutes.js';
import { createDraftRoutes } from '../routes/draftRoutes.js';
import { createImportRoutes } from '../routes/importRoutes.js';
import { createOrganizationRoutes } from '../routes/organizationRoutes.js';
import { createSystemRoutes } from '../routes/systemRoutes.js';

export interface CreateAppOptions {
  config: AppConfig;
  packageInfo: PackageInfo;
  logger?: pino.Logger;
}

export function createApp({ config, packageInfo, logger }: CreateAppOptions) {
  const app = express();
  const appLogger =
    logger ??
    pino({
      level: config.LOG_LEVEL,
      redact: ['req.headers.authorization', 'authorization', '*.token', '*.accessToken'],
    });

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(httpLogger(appLogger));
  app.use(attachSession);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new AppError('CORS_ORIGIN_DENIED', 'Origem não autorizada por CORS.', 403));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', createAuthRoutes(config));
  app.use('/api', createOrganizationRoutes());
  app.use('/api', createDraftRoutes());
  app.use('/api', createImportRoutes(config));
  app.use('/api', createSystemRoutes(config, packageInfo));
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
