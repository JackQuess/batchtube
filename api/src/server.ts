import { createApp } from './app.js';
import { config } from './config.js';
import { ensureBucket } from './storage/s3.js';

const app = createApp();

async function start() {
  await ensureBucket();
  await app.listen({
    host: '0.0.0.0',
    port: config.port
  });
}

start()
  .then(() => {
    app.log.info({ port: config.port }, 'batchtube_api_started');
  })
  .catch((error) => {
    app.log.error({ err: error }, 'batchtube_api_start_failed');
    process.exit(1);
  });
