'use strict';
require('dotenv').config();
const { validateEnv } = require('./src/config/envCheck');
validateEnv();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app                    = require('./app');
const db                     = require('./src/config/db');
const { connectRedis }       = require('./src/config/redis');
const { initializeBucket }   = require('./src/config/minio');
const logger                 = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  // ── 1. MySQL connection test
  try {
    const conn = await db.getConnection();
    logger.info('[Startup] MySQL connected successfully.');
    conn.release();
  } catch (err) {
    logger.error('[Startup] MySQL connection failed — exiting.', { error: err.message });
    process.exit(1);
  }

  // ── 2. Redis (non-blocking — app runs without cache if Redis is down)
  await connectRedis();

  // ── 3. MinIO bucket init (non-blocking)
  initializeBucket().catch(err =>
    logger.error('[Startup] MinIO init failed (file uploads may not work).', { error: err.message })
  );

  // ── 4. Start HTTP server
  const server = app.listen(PORT, HOST, () => {
    logger.info(`[Startup] Pravzo Unified Server running on http://${HOST}:${PORT}`);
    logger.info(`[Startup] Admin API  → http://localhost:${PORT}/api/admin`);
    logger.info(`[Startup] User API   → http://localhost:${PORT}/api`);
    logger.info(`[Startup] Health     → http://localhost:${PORT}/health`);
  });

  server.on('error', (err) => {
    logger.error('[Startup] Server error', { error: err.message });
    process.exit(1);
  });

  // ── 5. Graceful shutdown
  const shutdown = (signal) => {
    logger.info(`[Shutdown] ${signal} received — closing server.`);
    server.close(() => {
      logger.info('[Shutdown] HTTP server closed. Exiting.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000); // force exit after 10s
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

startServer();
