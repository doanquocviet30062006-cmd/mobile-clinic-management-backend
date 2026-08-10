import Redis from 'ioredis';
import { logger } from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  lazyConnect: true, // Don't connect immediately, allow graceful startup
};

// ─── db0: Cache (Doctor Rating, Configs) - volatile-lru ─────────
export const redisCache = new Redis({ ...redisConfig, db: 0 });

// ─── db1: Sessions & Tokens (Refresh tokens, Blacklist) - volatile-ttl
export const redisSession = new Redis({ ...redisConfig, db: 1 });

// ─── db2: Rate Limiting - volatile-ttl ──────────────────────────
export const redisRateLimit = new Redis({ ...redisConfig, db: 2 });

// ─── db3: Queues (Streams) - No auto eviction, worker must ACK ─
export const redisStream = new Redis({ ...redisConfig, db: 3 });

// ─── Connection event handlers ──────────────────────────────────
const clients = [
  { name: 'Cache (db0)', client: redisCache },
  { name: 'Session (db1)', client: redisSession },
  { name: 'RateLimit (db2)', client: redisRateLimit },
  { name: 'Stream (db3)', client: redisStream },
];

clients.forEach(({ name, client }) => {
  client.on('connect', () => logger.info(`Redis ${name} connected`));
  client.on('error', (err) => logger.error({ err }, `Redis ${name} error`));
});

/** Connect all Redis clients */
export const connectAllRedis = async (): Promise<void> => {
  for (const { name, client } of clients) {
    try {
      await client.connect();
    } catch (err) {
      logger.warn({ err }, `Redis ${name} not available - continuing without it`);
    }
  }
};

/** Disconnect all Redis clients */
export const disconnectAllRedis = async (): Promise<void> => {
  for (const { client } of clients) {
    await client.quit();
  }
};
