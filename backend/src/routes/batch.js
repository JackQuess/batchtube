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

    const response = {
      state: status,
      progress: typeof progress === 'number' ? progress : 0
    };

    // Add result if completed
    if (returnValue && state === 'completed') {
      response.result = returnValue.result;
      response.zipPath = returnValue.zipPath;
    }

    // Add error if failed
    if (state === 'failed') {
      const failedReason = await job.getFailedReason();
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
 * GET /api/batch/:jobId/download
 * Download the ZIP file
 */
router.get('/batch/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await batchQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }

    const state = await job.getState();

    if (state !== 'completed') {
      return res.status(400).json({ 
        error: 'Job is not completed yet' 
      });
    }

    const returnValue = job.returnvalue;

    if (!returnValue || !returnValue.zipPath) {
      return res.status(404).json({ 
        error: 'ZIP file not found' 
      });
    }

    const zipPath = returnValue.zipPath;

    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ 
        error: 'ZIP file not found on disk' 
      });
    }

    const zipName = `BatchTube_${jobId}.zip`;

    // Set headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    // Stream file
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);

    fileStream.on('end', async () => {
      // Cleanup after streaming
      try {
        const tempDir = path.dirname(zipPath);
        await fs.remove(tempDir);
        console.log(`[Batch] Cleaned up temp directory: ${tempDir}`);
      } catch (err) {
        console.error(`[Batch] Error cleaning up: ${err.message}`);
      }
    });

    fileStream.on('error', (err) => {
      console.error(`[Batch] Stream error: ${err}`);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error streaming file' 
        });
      } else {
        res.end();
      }
    });

  } catch (error) {
    console.error('[Batch] Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed' 
      });
    } else {
      res.end();
    }
  }
});

module.exports = router;
