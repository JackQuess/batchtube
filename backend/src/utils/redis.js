/**
 * Redis connection utility
 * Shared between queue and worker
 */
const IORedis = require('ioredis');

let redisConnection;

// Create Redis connection with retry and error handling
function createRedisConnection() {
  let config;

  if (process.env.REDIS_URL) {
    // Parse REDIS_URL (Railway format: redis://:password@host:port)
    const url = new URL(process.env.REDIS_URL);
    config = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Retry connection attempt ${times}, delay ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };
  } else {
    // Local development
    config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`[Redis] Retry connection attempt ${times}, delay ${delay}ms`);
        if (times > 10) {
          console.warn('[Redis] Max retries reached, giving up');
          return null; // Stop retrying
        }
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
      lazyConnect: true, // Don't connect immediately
    };
  }

  const connection = new IORedis(config);

  // Error handlers
  connection.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[Redis] Connection refused - Redis may not be running. Queue features will not work.');
    } else {
      console.error('[Redis] Error:', err.message);
    }
  });

  connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  connection.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
  });

  connection.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  return connection;
}

redisConnection = createRedisConnection();

module.exports = redisConnection;

