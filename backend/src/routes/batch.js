/**
 * BatchTube 2.0 - Batch Download Routes
 * Clean REST API for queue-based batch processing
 */
const express = require('express');
const batchQueue = require('../queue');
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
 * GET /api/batch/:jobId/download
 * Download the ZIP file from /tmp
 */
router.get('/batch/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and is completed
    if (batchQueue) {
      const job = await batchQueue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        if (state !== 'completed') {
          return res.status(400).json({ 
            error: 'Job is not completed yet' 
          });
        }
      }
    }

    // ZIP file is stored in /tmp by worker
    const filePath = path.join('/tmp', `${jobId}.zip`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'ZIP not ready yet' 
      });
    }

    const zipName = `BatchTube_${jobId}.zip`;

    // Set headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    // Send file and delete after download
    res.download(filePath, zipName, (err) => {
      if (err) {
        console.error(`[Batch] Download error:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      } else {
        // Cleanup after successful download
        try {
          fs.unlinkSync(filePath);
          console.log(`[Batch] ZIP removed after download: ${filePath}`);
        } catch (cleanupErr) {
          console.error(`[Batch] Failed to cleanup ZIP: ${cleanupErr.message}`);
        }
      }
    });

  } catch (error) {
    console.error('[Batch] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed' 
      });
    }
  }
});

module.exports = router;
