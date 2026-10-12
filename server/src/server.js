import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';

const app = createApp();

// Bind to 0.0.0.0 so other devices on the LAN can reach us.
// In production, put this behind a reverse proxy (nginx) instead.
const HOST = '0.0.0.0';

const server = app.listen(env.port, HOST, () => {
  logger.info(`🚀 DeliverIt API listening on http://${HOST}:${env.port}`);
  logger.info(`   Local:   http://localhost:${env.port}`);
  logger.info(`   Network: http://<your-LAN-IP>:${env.port}`);
});

async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));