import { createServer } from 'node:http';
import { createApp } from './app/createApp.js';
import { loadConfig } from './config/env.js';
import { loadPackageInfo } from './config/packageInfo.js';

const config = loadConfig({ ...process.env, NODE_ENV: 'test', PORT: '3001' });
const app = createApp({ config, packageInfo: loadPackageInfo() });
const server = createServer(app);

server.listen(0, '127.0.0.1', async () => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Smoke server did not expose a TCP address.');
  }

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const body = (await response.json()) as {
      ok: boolean;
      data: { version: string };
    };
    if (!response.ok || body.ok !== true) {
      throw new Error(`Smoke failed with status ${response.status}`);
    }
    console.log(`smoke:api ok ${body.data.version}`);
  } finally {
    server.close();
  }
});
