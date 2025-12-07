/**
 * BatchTube 2.0 - Batch Download Routes
 * Clean REST API for queue-based batch processing
 */
const express = require('express');
const batchQueue = require('../queue');
const redisConnection = require('../utils/redis');
const path = require('path');
const fs = require('fs-extra');

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
      quality
    }, {
      jobId: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

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
 * Worker sends ZIP part binary to API
 */
router.post(
  '/batch/upload-part',
  express.raw({ type: '*/*', limit: '500mb' }),
  (req, res) => {
    try {
      const jobId = req.headers['x-job-id'];
      const index = req.headers['x-part-index'];
      const size = req.headers['x-part-size'];

      if (!jobId || !index) {
        return res.status(400).json({ error: 'Missing jobId or partIndex' });
      }

      const zipBuffer = req.body;

      if (!zipBuffer || !zipBuffer.length) {
        return res.status(400).json({ error: 'Empty ZIP part' });
      }

      const tempDir = `/tmp/batchtube/${jobId}`;
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = `${tempDir}/${jobId}.part${index}.zip`;
      fs.writeFileSync(filePath, zipBuffer);

      console.log(`[API] Saved ZIP part #${index} (${size || zipBuffer.length} bytes)`);

      return res.json({ success: true });
    } catch (err) {
      console.error('[API] ZIP part upload error:', err);
      res.status(500).json({ error: 'Part upload failed' });
    }
  }
);

/**
 * GET /api/batch/:jobId/download
 * Combine all ZIP parts and stream to user
 */
router.get('/batch/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const dir = `/tmp/batchtube/${jobId}`;

    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: 'ZIP not ready yet' });
    }

    const parts = fs
      .readdirSync(dir)
      .filter(f => f.endsWith('.zip'))
      .sort((a, b) => {
        const ai = Number(a.match(/part(\d+)/)?.[1] || 0);
        const bi = Number(b.match(/part(\d+)/)?.[1] || 0);
        return ai - bi;
      });

    if (parts.length === 0) {
      return res.status(404).json({ error: 'ZIP not ready yet' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="batch-${jobId}.zip"`);

    for (const p of parts) {
      const full = `${dir}/${p}`;
      const data = fs.readFileSync(full);
      res.write(data);
    }

    res.end();

    // Clean up after a delay
    setTimeout(() => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[API] Cleaned up ZIP directory: ${dir}`);
      } catch (cleanupErr) {
        console.error(`[API] Failed to cleanup: ${cleanupErr.message}`);
      }
    }, 5000);

  } catch (error) {
    console.error('[Batch] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
});

module.exports = router;
