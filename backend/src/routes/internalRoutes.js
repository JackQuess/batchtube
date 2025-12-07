/**
 * Internal API routes for worker-to-API communication
 * Used for transferring ZIP files from worker to API container
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * POST /internal/upload-zip
 * Worker sends ZIP file to API as base64
 */
router.post('/upload-zip', async (req, res) => {
  try {
    const { jobId, zipData } = req.body;

    if (!jobId || !zipData) {
      return res.status(400).json({ error: 'Missing jobId or zipData' });
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(zipData, 'base64');
    
    // Save to /tmp directory (Railway compatible)
    const filePath = path.join('/tmp', `${jobId}.zip`);
    
    // Ensure /tmp directory exists
    fs.mkdirSync('/tmp', { recursive: true });
    
    // Write file
    fs.writeFileSync(filePath, buffer);
    
    console.log(`[Internal] ZIP saved to ${filePath} (${buffer.length} bytes)`);
    
    return res.json({ success: true, filePath });
  } catch (err) {
    console.error('[Internal] Upload ZIP error:', err);
    res.status(500).json({ error: 'Failed to save ZIP' });
  }
});

module.exports = router;

