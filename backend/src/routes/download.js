import { jobStore } from '../core/jobStore.js';
import path from 'path';
import fs from 'fs-extra';

export const handleDownloadFile = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStore.getJob(jobId);

    if (!job || job.status !== 'completed') {
      return res.status(404).send('File not ready or expired');
    }

    // ZIP file path: /tmp/jobId/result.zip
    const jobDir = path.join(jobStore.getTempDir(), job.id);
    const zipPath = path.join(jobDir, 'result.zip');
    
    if (!fs.existsSync(zipPath)) {
      return res.status(404).send('ZIP file not found');
    }

    const zipName = `BatchTube_${job.id}.zip`;
    console.log(`[Download] Streaming ZIP: ${zipName} for job ${jobId}`);

    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    // Stream ZIP file from disk
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      console.log(`[Download] ZIP stream completed for job ${jobId}`);
    });

    fileStream.on('error', (err) => {
      console.error(`[Download] Stream error for ${zipPath}:`, err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      } else {
        res.end();
      }
    });

  } catch (error) {
    console.error('[Download] Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Download failed');
    } else {
      res.end();
    }
  }
};
