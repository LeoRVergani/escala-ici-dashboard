import { createServer } from 'node:http';
import pino from 'pino';
import { createApp } from './app/createApp.js';
import { loadConfig } from './config/env.js';
import { loadPackageInfo } from './config/packageInfo.js';

const config = loadConfig();
const packageInfo = loadPackageInfo();
const logger = pino({ level: config.LOG_LEVEL });
const app = createApp({ config, packageInfo, logger });
const server = createServer(app);

server.listen(config.PORT, '127.0.0.1', () => {
  logger.info(
    {
      port: config.PORT,
      environment: config.NODE_ENV,
      officialPublicationEnabled: config.ALLOW_OFFICIAL_FIRESTORE_WRITE,
    },
    'api_started',
  );
});
