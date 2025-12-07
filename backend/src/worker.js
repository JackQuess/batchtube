/**
 * BatchTube 2.0 - Background Worker
 * Processes batch download jobs from the queue
 */
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { downloadWithYtDlp } from './core/ytService.js';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import os from 'os';
import pLimit from 'p-limit';

// Redis connection (same as queue.js)
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

// Concurrency limit
const limit = pLimit(3);

/**
 * Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
    .trim() || 'video';
}

/**
 * Download a single video item
 */
async function downloadItem(item, tempDir, job, onProgress) {
  const { url, format, quality = '1080p', title, index } = item;
  
  const safeTitle = sanitizeFilename(title || `item_${index}`);
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const outputPath = path.join(tempDir, `${safeTitle}.${ext}`);

  try {
    await downloadWithYtDlp({
      url,
      format,
      quality,
      outputPath,
      onProgress: (percent, textLine) => {
        onProgress(index, percent);
      }
    });

    // Wait for file system sync
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find actual downloaded file
    let actualFile = null;
    let actualPath = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      try {
        if (!fs.existsSync(tempDir)) continue;

        const files = fs.readdirSync(tempDir);
        const mediaExtensions = format === 'mp3' 
          ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg']
          : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];

        const mediaFiles = files.filter(f => {
          const ext = path.extname(f).toLowerCase();
          return mediaExtensions.includes(ext);
        });

        if (mediaFiles.length === 0) continue;

        const filesWithStats = mediaFiles.map(f => {
          const filePath = path.join(tempDir, f);
          try {
            const stats = fs.statSync(filePath);
            return { path: filePath, name: f, size: stats.size, mtime: stats.mtime };
          } catch (e) {
            return null;
          }
        }).filter(f => f !== null && f.size >= 100 * 1024);

        if (filesWithStats.length === 0) continue;

        filesWithStats.sort((a, b) => {
          if (b.mtime.getTime() !== a.mtime.getTime()) {
            return b.mtime.getTime() - a.mtime.getTime();
          }
          return b.size - a.size;
        });

        const found = filesWithStats.find(f => 
          f.name.startsWith(safeTitle) || f.path === outputPath
        ) || filesWithStats[0];

        if (found && found.size >= 100 * 1024) {
          actualFile = found.name;
          actualPath = found.path;
          break;
        }
      } catch (err) {
        console.error(`[Worker] Error scanning directory (attempt ${attempt + 1}):`, err.message);
      }
    }

    if (!actualFile || !actualPath) {
      throw new Error('Output file not found after download');
    }

    // Rename to expected name if different
    if (actualFile !== `${safeTitle}.${ext}`) {
      const expectedPath = path.join(tempDir, `${safeTitle}.${ext}`);
      if (fs.existsSync(expectedPath) && expectedPath !== actualPath) {
        fs.unlinkSync(expectedPath);
      }
      if (actualPath !== expectedPath) {
        fs.moveSync(actualPath, expectedPath);
        actualPath = expectedPath;
      }
    }

    return {
      id: index,
      status: 'success',
      fileName: `${safeTitle}.${ext}`,
      filePath: actualPath
    };
  } catch (error) {
    console.error(`[Worker] Item ${index} failed:`, error);
    return {
      id: index,
      status: 'failed',
      error: error.message || 'Download failed'
    };
  }
}

/**
 * Create ZIP archive
 */
async function createZip(tempDir, files, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const zipSize = archive.pointer();
      if (zipSize < 100) {
        reject(new Error('ZIP file is too small'));
        return;
      }
      console.log(`[Worker] ZIP created: ${zipPath} (${zipSize} bytes)`);
      resolve(zipSize);
    });

    archive.on('error', (err) => {
      console.error('[Worker] ZIP creation error:', err);
      reject(err);
    });

    archive.pipe(output);

    files.forEach(file => {
      if (fs.existsSync(file.filePath)) {
        archive.file(file.filePath, { name: file.fileName });
      }
    });

    archive.finalize();
  });
}

/**
 * Worker process
 */
const worker = new Worker(
  'batch-downloads',
  async (job) => {
    const { items, format, quality } = job.data;
    const jobId = job.id;

    console.log(`[Worker] Processing job ${jobId} with ${items.length} items`);

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), 'batchtube', jobId);
    fs.ensureDirSync(tempDir);

    const results = [];
    const progressMap = new Map();

    // Update progress callback
    const updateProgress = (index, percent) => {
      progressMap.set(index, percent);
      const overallPercent = Math.round(
        Array.from(progressMap.values()).reduce((a, b) => a + b, 0) / items.length
      );
      job.updateProgress(overallPercent);
    };

    // Download all items in parallel with concurrency limit
    const downloadTasks = items.map((item, index) =>
      limit(() => downloadItem(item, tempDir, job, updateProgress))
    );

    const downloadResults = await Promise.allSettled(downloadTasks);

    // Process results
    downloadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          id: index,
          status: 'failed',
          error: result.reason?.message || 'Download failed'
        });
      }
    });

    // Filter successful downloads
    const successful = results.filter(r => r.status === 'success' && r.filePath);
    
    if (successful.length === 0) {
      throw new Error('No items downloaded successfully');
    }

    // Create ZIP
    const zipPath = path.join(tempDir, `${jobId}.zip`);
    await createZip(tempDir, successful, zipPath);

    // Return job result
    return {
      jobId,
      zipPath,
      result: {
        total: items.length,
        succeeded: successful.length,
        failed: items.length - successful.length,
        results: results.map(r => ({
          id: r.id,
          status: r.status,
          error: r.error || undefined
        }))
      }
    };
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one batch job at a time
    limiter: {
      max: 1,
      duration: 1000
    }
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] Error:', err);
});

console.log('[Worker] Batch download worker started');

export default worker;

