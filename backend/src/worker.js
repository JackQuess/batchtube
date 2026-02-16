/**
 * BatchTube 2.0 - Background Worker
 * Processes batch download jobs from the queue
 * 
 * Run separately: node backend/src/worker.js
 */
const { Worker } = require('bullmq');
const redisConnection = require('./utils/redis');
const { createZipParts } = require('./utils/zip');
const { sanitizeFilename } = require('./utils/helpers');
const { getProviderForUrl } = require('./providers');
const { ProviderError } = require('./providers/shared');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const pLimit = require('p-limit').default;
const axios = require('axios');

// Concurrency limit
const limit = pLimit(3);

/**
 * Upload ZIP part to API as binary
 * @param {string} jobId - Job ID
 * @param {Object} part - Part object with {part, path, size}
 */
async function uploadZipPart(jobId, part) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    
    await axios.post(
      `${apiUrl}/api/batch/upload-part`,
      fs.readFileSync(part.path),
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Job-Id': jobId,
          'X-Part-Index': part.part.toString(),
          'X-Part-Size': part.size.toString(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    
    console.log(`[Worker] Uploaded ZIP part ${part.part}`);
    return true;
  } catch (err) {
    console.error(`[Worker] ZIP part ${part.part} upload error:`, err.message);
    throw err; // Throw to fail the job if upload fails
  }
}

/**
 * Download a single video item
 */
function toStandardError(error, fallbackCode) {
  if (error instanceof ProviderError) {
    return {
      code: error.code,
      message: error.message || 'Provider error',
      hint: error.hint
    };
  }

  if (error && typeof error === 'object' && error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      hint: error.hint
    };
  }

  return {
    code: fallbackCode || 'UNKNOWN',
    message: error?.message || 'Unknown error'
  };
}

async function downloadItem(item, tempDir, onProgress) {
  const { url, format, quality = '1080p', title, index } = item;
  const provider = getProviderForUrl(url);
  const safeTitle = sanitizeFilename(title || `item_${index + 1}`);
  const providerFormat = format === 'mp3' ? 'audio' : 'video';
  let meta = null;
  let metadataError = null;

  try {
    onProgress(index, {
      status: 'downloading',
      provider: provider.id,
      percent: 0,
      meta: null
    });

    try {
      meta = await provider.getMetadata(url);
      onProgress(index, {
        provider: provider.id,
        meta
      });
    } catch (metaErr) {
      metadataError = toStandardError(metaErr, 'METADATA_FAILED');
      onProgress(index, {
        provider: provider.id,
        meta: null
      });
    }

    const downloadResult = await provider.download(url, {
      outDir: tempDir,
      format: providerFormat,
      quality,
      baseName: safeTitle,
      onProgress: (percent) => {
        onProgress(index, {
          status: 'downloading',
          provider: provider.id,
          meta,
          percent: Math.round(percent || 0)
        });
      }
    });

    return {
      id: index,
      status: 'success',
      provider: provider.id,
      fileName: downloadResult.fileName,
      filePath: downloadResult.filePath,
      bytes: downloadResult.bytes,
      meta,
      metadataError
    };
  } catch (error) {
    const stdError = toStandardError(error, 'DOWNLOAD_FAILED');
    console.error(`[Worker] Item ${index} failed:`, stdError.message);
    return {
      id: index,
      status: 'failed',
      provider: provider.id,
      meta,
      error: stdError,
      metadataError
    };
  }
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

    const updateProgress = (index, patch) => {
      const existing = progressMap.get(index) || {
        index,
        percent: 0,
        status: 'downloading',
        provider: null,
        meta: null,
        error: null
      };

      const next = {
        ...existing,
        ...patch
      };
      progressMap.set(index, next);

      const overallPercent = Math.round(
        Array.from(progressMap.values()).reduce((sum, state) => {
          return sum + Math.max(0, Math.min(100, Number(state.percent) || 0));
        }, 0) / items.length
      );

      const progressData = {
        overall: overallPercent,
        items: items.map((item, idx) => {
          const state = progressMap.get(idx) || {};
          const meta = state.meta || null;
          return {
            index: idx,
            percent: Math.round(state.percent || 0),
            status: state.status || 'downloading',
            provider: state.provider || null,
            meta,
            error: state.error || undefined,
            title: meta?.title || item?.title || `Item ${idx + 1}`,
            thumbnail: meta?.thumbnail || item?.thumbnail || null
          };
        })
      };

      job.updateProgress(progressData);
    };

    items.forEach((item, index) => {
      updateProgress(index, {
        status: 'downloading',
        provider: null,
        percent: 0,
        meta: null
      });
    });

    // Download all items in parallel with concurrency limit
    const downloadTasks = items.map((item, index) =>
      limit(() => downloadItem(item, tempDir, updateProgress))
    );

    const downloadResults = await Promise.allSettled(downloadTasks);

    // Process results
    downloadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const value = result.value;
        results.push(value);
        updateProgress(index, {
          status: value.status === 'success' ? 'done' : 'failed',
          provider: value.provider || null,
          percent: 100,
          meta: value.meta || null,
          error: value.error || undefined
        });
      } else {
        const failed = {
          id: index,
          status: 'failed',
          provider: getProviderForUrl(items[index]?.url || '').id,
          error: toStandardError(result.reason, 'DOWNLOAD_FAILED'),
          meta: null
        };
        results.push(failed);
        updateProgress(index, {
          status: 'failed',
          provider: failed.provider,
          percent: 100,
          meta: null,
          error: failed.error
        });
      }
    });

    // Filter successful downloads
    const successful = results.filter(r => r.status === 'success' && r.filePath);
    
    if (successful.length === 0) {
      const codes = Array.from(
        new Set(
          results
            .filter((r) => r.status === 'failed' && r.error?.code)
            .map((r) => r.error.code)
        )
      );
      const codeSuffix = codes.length ? ` [codes: ${codes.join(', ')}]` : '';
      throw new Error(`No items downloaded successfully${codeSuffix}`);
    }

    // Prepare files for ZIP creation (map to {path, filename})
    const downloadedFiles = successful.map(r => ({
      path: r.filePath,
      filename: r.fileName
    }));

    console.log(`[Worker] Creating ZIP parts for ${downloadedFiles.length} files...`);

    // Create ZIP parts
    const parts = await createZipParts(jobId, downloadedFiles);

    console.log(`[Worker] Created ${parts.length} ZIP part(s), uploading to API...`);

    // Upload each ZIP part to API
    for (const part of parts) {
      console.log(`[Worker] Uploading ZIP part ${part.part}...`);
      await uploadZipPart(jobId, part);
    }

    console.log(`[Worker] All ZIP parts uploaded successfully`);

    // Clean up local ZIP parts after sending to API
    for (const part of parts) {
      try {
        fs.unlinkSync(part.path);
        console.log(`[Worker] Cleaned up local ZIP part: ${part.path}`);
      } catch (cleanupError) {
        console.warn(`[Worker] Failed to cleanup ZIP part ${part.part}: ${cleanupError.message}`);
      }
    }

    // Return job result (no zipPath needed, API has it)
    return {
      jobId,
      result: {
        batchStatus: successful.length < items.length ? 'completed_with_errors' : 'completed',
        total: items.length,
        succeeded: successful.length,
        failed: items.length - successful.length,
        items: items.map((item, index) => ({
          id: index,
          title: results[index]?.meta?.title || item.title || `Item ${index + 1}`,
          thumbnail: results[index]?.meta?.thumbnail || item.thumbnail || null,
          provider: results[index]?.provider || getProviderForUrl(item.url).id,
          meta: results[index]?.meta || undefined,
          status: results[index]?.status || 'failed'
        })),
        results: results.map(r => ({
          id: r.id,
          provider: r.provider || null,
          meta: r.meta || undefined,
          status: r.status,
          fileName: r.fileName || null, // ⭐ Real video filename
          bytes: r.bytes || undefined,
          error: r.error?.message || r.error || undefined,
          errorCode: r.error?.code || undefined,
          hint: r.error?.hint || undefined
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

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
