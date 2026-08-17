import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error(err, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Connected to Redis successfully.');
});
