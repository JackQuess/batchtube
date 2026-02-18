/**
 * BatchTube 2.0 - Batch Download Routes
 * Clean REST API for queue-based batch processing
 */
const express = require('express');
const batchQueue = require('../queue');
const redisConnection = require('../utils/redis');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const archiver = require('archiver');
const { getRequestUser } = require('../utils/auth');
const { ensureProfile, getSubscription, getUsageMonthly, incrementUsage, monthKey } = require('../utils/supabaseAdmin');
const { getPlanFromSubscription, checkProviderAccess, checkBatchLimits } = require('../utils/planLimits');

const router = express.Router();

/**
 * POST /api/batch
 * Create a new batch download job
 */
router.post('/batch', async (req, res) => {
  try {
    // Check if queue is available
    if (!batchQueue) {
      return res.status(503).json({ 
        error: 'Queue system unavailable. Redis connection required.' 
      });
    }

    const { items, format, quality = '1080p' } = req.body;
    const requestUser = getRequestUser(req);

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items array required with at least 1 item' 
      });
    }

    if (!format || !['mp3', 'mp4'].includes(format)) {
      return res.status(400).json({ 
        error: 'Format must be mp3 or mp4' 
      });
    }

    if (quality && !['1080p', '4k'].includes(quality)) {
      return res.status(400).json({ 
        error: 'Quality must be 1080p or 4k' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.url) {
        return res.status(400).json({ 
          error: 'Each item must have a url' 
        });
      }
    }

    let plan = 'free';
    let usage = null;
    if (requestUser?.id) {
      await ensureProfile(requestUser.id, requestUser.email);
      const [subscription, usageRow] = await Promise.all([
        getSubscription(requestUser.id),
        getUsageMonthly(requestUser.id, monthKey())
      ]);
      plan = getPlanFromSubscription(subscription);
      usage = usageRow
        ? {
            batchesCount: Number(usageRow.batches_count || 0),
            itemsCount: Number(usageRow.items_count || 0)
          }
        : { batchesCount: 0, itemsCount: 0 };
    }

    const providerError = checkProviderAccess(items, plan);
    if (providerError) {
      return res.status(403).json({
        error: 'Provider restricted for current plan',
        code: providerError.code,
        provider: providerError.provider
      });
    }

    const limitError = checkBatchLimits({
      userId: requestUser?.id || null,
      plan,
      itemsCount: items.length,
      usage
    });
    if (limitError) {
      return res.status(403).json({
        error: 'Plan usage limit reached',
        code: limitError.code,
        details: limitError
      });
    }

    // Add job to queue
    const job = await batchQueue.add('batch-download', {
      items: items.map((item, index) => ({
        url: item.url,
        format,
        quality,
        title: item.title || `Item ${index + 1}`,
        thumbnail: item.thumbnail || null,
        index
      })),
      format,
      quality,
      userId: requestUser?.id || null,
      plan
    }, {
      jobId: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    if (requestUser?.id) {
      await incrementUsage(requestUser.id, items.length);
    }

    console.log(`[Batch] Created job ${job.id} with ${items.length} items`);

    res.json({ 
      jobId: job.id 
    });
  } catch (error) {
    console.error('[Batch] Error:', error);
    res.status(500).json({ 
      error: 'Failed to create batch job' 
    });
  }
});

/**
 * GET /api/batch/:jobId/status
 * Get batch job status
 */
router.get('/batch/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await batchQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    const state = await job.getState();
    const progress = job.progress || 0;
    const returnValue = job.returnvalue;

    // Map BullMQ state to our status
    let status;
    if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'failed';
    } else if (state === 'active') {
      status = 'active';
    } else {
      status = 'waiting';
    }

    // Handle both number and object progress formats
    let progressValue = 0;
    if (typeof progress === 'number') {
      progressValue = progress;
    } else if (progress && typeof progress === 'object' && progress.overall) {
      progressValue = progress.overall;
    }

    const response = {
      state: status,
      progress: progressValue
    };

    // If job stays in waiting state and no worker is connected, surface explicit error
    if ((status === 'waiting' || status === 'active') && batchQueue) {
      try {
        const workersCount = await batchQueue.getWorkersCount();
        const queuedForMs = Date.now() - (job.timestamp || Date.now());
        const stuckThresholdMs = 20 * 1000;

        if (status === 'waiting' && workersCount === 0 && queuedForMs > stuckThresholdMs) {
          response.state = 'failed';
          response.error = 'Worker unavailable. Queue is waiting but no active worker is connected.';
          response.errorCode = 'WORKER_UNAVAILABLE';
          response.workers = workersCount;
          response.queuedForMs = queuedForMs;
          return res.json(response);
        }

        response.workers = workersCount;
      } catch (_) {
        // Ignore worker count errors to avoid breaking status endpoint
      }
    }

    // Add result if completed
    if (returnValue && state === 'completed') {
      response.result = returnValue.result;
      response.zipPath = returnValue.zipPath;
    }

    // Add error if failed
    if (state === 'failed') {
      const failedReason = job.failedReason; // Direct property access
      response.error = failedReason || 'Job failed';
    }

    res.json(response);
  } catch (error) {
    console.error('[Batch] Status error:', error);
    res.status(500).json({ 
      error: 'Failed to get job status' 
    });
  }
});

/**
 * GET /api/batch/:jobId/events
 * Server-Sent Events stream for live progress updates
 */
router.get('/batch/:jobId/events', async (req, res) => {
  try {
    if (!batchQueue) {
      return res.status(503).json({ 
        error: 'Queue system unavailable. Redis connection required.' 
      });
    }

    const { jobId } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    res.write(': connected\n\n');

    // Get job
    const job = await batchQueue.getJob(jobId);
    if (!job) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
      res.end();
      return;
    }

    // Poll job progress
    const pollInterval = setInterval(async () => {
      try {
        const currentJob = await batchQueue.getJob(jobId);
        if (!currentJob) {
          clearInterval(pollInterval);
          res.write(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
          res.end();
          return;
        }

        const state = await currentJob.getState();
        const progress = currentJob.progress || 0;

        // Early fail event if queue is waiting but no worker is connected for a while
        if (state === 'waiting') {
          try {
            const workersCount = await batchQueue.getWorkersCount();
            const queuedForMs = Date.now() - (currentJob.timestamp || Date.now());
            if (workersCount === 0 && queuedForMs > 20 * 1000) {
              clearInterval(pollInterval);
              res.write(`event: failed\ndata: ${JSON.stringify({ error: 'Worker unavailable. No active worker is connected.', errorCode: 'WORKER_UNAVAILABLE' })}\n\n`);
              res.end();
              return;
            }
          } catch (_) {
            // Keep normal polling flow if worker count cannot be read
          }
        }

        // Send progress update (full object with items, title, thumbnail)
        const progressData = typeof progress === 'object' && progress.items
          ? progress
          : {
              overall: typeof progress === 'number' ? progress : 0,
              items: []
            };

        res.write(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`);

        // Close connection if job is completed or failed
        if (state === 'completed' || state === 'failed') {
          clearInterval(pollInterval);
          
          if (state === 'completed') {
            const returnValue = currentJob.returnvalue;
            res.write(`event: completed\ndata: ${JSON.stringify({ result: returnValue?.result })}\n\n`);
          } else {
            res.write(`event: failed\ndata: ${JSON.stringify({ error: currentJob.failedReason || 'Job failed' })}\n\n`);
          }
          
          res.end();
        }
      } catch (err) {
        console.error('[Batch] SSE polling error:', err);
        clearInterval(pollInterval);
        res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    }, 1000); // Poll every 1 second

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(pollInterval);
      res.end();
    });

  } catch (error) {
    console.error('[Batch] SSE error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE connection failed' });
    } else {
      res.end();
    }
  }
});

/**
 * POST /api/batch/upload-part
 * Worker sends ZIP part binary to API (supports all media formats)
 */
router.post(
  '/batch/upload-part',
  express.raw({ type: '*/*', limit: '500mb' }),
  (req, res) => {
    try {
      const job = req.headers['x-job-id'];
      const index = req.headers['x-part-index'];
      const size = req.headers['x-part-size'];

      if (!job || !index) {
        return res.status(400).json({ error: 'Missing jobId or partIndex' });
      }

      const zipBuffer = req.body;

      if (!zipBuffer || !zipBuffer.length) {
        return res.status(400).json({ error: 'Empty ZIP part' });
      }

      const dir = `/tmp/batchtube/${job}`;
      fs.mkdirSync(dir, { recursive: true });

      const out = `${dir}/${job}.part${index}.zip`;
      fs.writeFileSync(out, zipBuffer);

      console.log(`[API] Saved part #${index} (${size || zipBuffer.length} bytes)`);

      return res.json({ success: true });
    } catch (err) {
      console.error('[API] ZIP part upload error:', err);
      res.status(500).json({ error: 'Part upload failed' });
    }
  }
);

/**
 * GET /api/batch/:jobId/download
 * Extract all ZIP parts and create a single valid ZIP file
 */
router.get('/batch/:jobId/download', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const dir = `/tmp/batchtube/${jobId}`;

    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: 'ZIP not ready yet' });
    }

    // Find all ZIP parts and sort by part number
    const parts = fs
      .readdirSync(dir)
      .filter(f => f.startsWith(jobId) && f.endsWith('.zip'))
      .sort((a, b) => {
        const pa = parseInt(a.match(/part(\d+)/)?.[1] || 0);
        const pb = parseInt(b.match(/part(\d+)/)?.[1] || 0);
        return pa - pb;
      });

    if (parts.length === 0) {
      return res.status(404).json({ error: 'ZIP not ready yet' });
    }

    console.log(`[API] Merging ${parts.length} ZIP part(s) for job ${jobId}`);

    // Create extraction directory
    const extractDir = `${dir}/extracted`;
    fs.mkdirSync(extractDir, { recursive: true });

    // Extract all files from each ZIP part
    for (const part of parts) {
      const partPath = path.join(dir, part);
      console.log(`[API] Extracting ${part}...`);
      
      try {
        const zip = new AdmZip(partPath);
        zip.extractAllTo(extractDir, true); // true = overwrite existing files
      } catch (extractErr) {
        console.error(`[API] Failed to extract ${part}:`, extractErr.message);
        throw new Error(`Failed to extract ZIP part: ${part}`);
      }
    }

    console.log(`[API] All parts extracted, creating final ZIP...`);

    // Create final ZIP with all extracted files
    const finalPath = `${dir}/job-final.zip`;
    const output = fs.createWriteStream(finalPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    // Add all extracted files to the final ZIP
    const files = fs.readdirSync(extractDir);
    for (const file of files) {
      const filePath = path.join(extractDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        archive.file(filePath, { name: file });
      }
    }

    // Wait for archive to finalize
    await new Promise((resolve, reject) => {
      output.on('close', () => {
        const finalSize = fs.statSync(finalPath).size;
        console.log(`[API] Final ZIP created: ${finalPath} (${finalSize} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        console.error('[API] Archive creation error:', err);
        reject(err);
      });

      archive.finalize();
    });

    // Set headers and stream the final ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="batchtube_${jobId}.zip"`);

    const finalStream = fs.createReadStream(finalPath);
    finalStream.pipe(res);

    finalStream.on('end', () => {
      console.log(`[API] Final ZIP sent to client`);
    });

    finalStream.on('error', (err) => {
      console.error('[API] Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream ZIP' });
      }
    });

    // Cleanup after delay
    setTimeout(() => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[API] Cleaned up ZIP directory: ${dir}`);
      } catch (cleanupErr) {
        console.error(`[API] Failed to cleanup: ${cleanupErr.message}`);
      }
    }, 8000);

  } catch (error) {
    console.error('[Batch] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

module.exports = router;
