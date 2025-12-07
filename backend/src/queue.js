/**
 * BatchTube 2.0 - Queue System
 * BullMQ queue configuration for batch downloads
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
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

// Create batch download queue
export const batchQueue = new Queue('batch-downloads', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Queue event handlers
batchQueue.on('error', (error) => {
  console.error('[Queue] Error:', error);
});

batchQueue.on('waiting', (jobId) => {
  console.log(`[Queue] Job ${jobId} is waiting`);
});

batchQueue.on('active', (job) => {
  console.log(`[Queue] Job ${job.id} is now active`);
});

batchQueue.on('completed', (job) => {
  console.log(`[Queue] Job ${job.id} completed`);
});

batchQueue.on('failed', (job, err) => {
  console.error(`[Queue] Job ${job?.id} failed:`, err.message);
});

export default batchQueue;

