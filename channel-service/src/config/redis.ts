import IORedis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis | null {
  if (env.useInlineJobs) return null;

  if (!connection) {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    connection.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }

  return connection;
}

export async function connectRedis(): Promise<boolean> {
  const redis = getRedisConnection();
  if (!redis) return false;

  try {
    await redis.connect();
    logger.info('Connected to Redis');
    return true;
  } catch (error) {
    logger.warn('Redis unavailable, using inline delivery processing', { error });
    return false;
  }
}
