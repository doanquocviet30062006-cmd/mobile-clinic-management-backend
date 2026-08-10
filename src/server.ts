import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { logger } from './config/logger';
import { primaryPool, replicaPool } from './config/database';
import { connectAllRedis, disconnectAllRedis } from './config/redis';

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // ─── Test PostgreSQL connections ──────────────────────────────
    try {
      await primaryPool.query('SELECT 1');
      logger.info('PostgreSQL Primary connected successfully');
    } catch (err) {
      logger.warn('PostgreSQL Primary not available - continuing without DB');
    }

    try {
      await replicaPool.query('SELECT 1');
      logger.info('PostgreSQL Replica connected successfully');
    } catch (err) {
      logger.warn('PostgreSQL Replica not available - using Primary for reads');
    }

    // ─── Connect Redis ───────────────────────────────────────────
    await connectAllRedis();

    // ─── Start HTTP server ───────────────────────────────────────
    app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
        },
        `🏥 Clinic Management Server running on port ${PORT}`
      );
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// ─── Graceful Shutdown ─────────────────────────────────────────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  await primaryPool.end();
  await replicaPool.end();
  await disconnectAllRedis();
  logger.info('All connections closed. Exiting.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
