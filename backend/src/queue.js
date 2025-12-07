/**
 * BatchTube 2.0 - Queue System
 * BullMQ queue configuration for batch downloads
 */
const { Queue } = require('bullmq');
const redisConnection = require('./utils/redis');

let batchQueue;

try {
  // Create batch download queue
  batchQueue = new Queue('batch-downloads', {
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
    // Only log if it's not a connection error (those are handled by Redis connection)
    if (error.code !== 'ECONNREFUSED') {
      console.error('[Queue] Error:', error.message);
    }
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

  console.log('[Queue] Batch download queue initialized');
} catch (err) {
  console.warn('[Queue] Failed to initialize queue:', err.message);
  console.warn('[Queue] Batch download features will not be available');
  batchQueue = null;
}

module.exports = batchQueue;
