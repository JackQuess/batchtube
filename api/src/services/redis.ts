import { Redis } from 'ioredis';
import { config } from '../config.js';

/** Backoff for Redis connection/reconnection (e.g. Railway internal DNS EAI_AGAIN). */
function redisRetryStrategy(times: number): number {
  const delay = Math.min(2000 * Math.pow(2, times), 30000);
  return delay;
}

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: redisRetryStrategy,
  connectTimeout: 15000
});

redis.on('error', (err) => {
  console.warn(JSON.stringify({ msg: 'redis_error', err: err.message, code: (err as NodeJS.ErrnoException).code }));
});
