/**
 * Redis connection utility
 * Shared between queue and worker
 */
const IORedis = require('ioredis');

let redisConnection;

if (process.env.REDIS_URL) {
  // Parse REDIS_URL (Railway format: redis://:password@host:port)
  const url = new URL(process.env.REDIS_URL);
  redisConnection = new IORedis({
    host: url.hostname,
    port: parseInt(url.port) || 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
} else {
  // Local development
  redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

module.exports = redisConnection;

