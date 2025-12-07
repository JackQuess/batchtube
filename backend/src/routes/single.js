import { Router } from 'express';
import { jobStore } from '../core/jobStore.js';
import { fileStore } from '../core/fileStore.js';
import { downloadWithYtDlp } from '../core/ytService.js';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

const router = Router();

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
 * POST /api/single-download
 */
router.post('/single-download', async (req, res) => {
  try {
    const { url, format, quality = "1080p" } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!format || !['mp3', 'mp4'].includes(format)) {
      return res.status(400).json({ error: 'Format must be mp3 or mp4' });
    }

    if (quality && !['1080p', '4k'].includes(quality)) {
      return res.status(400).json({ error: 'Quality must be 1080p or 4k' });
    }

    // Create job
    const job = jobStore.createSingleJob({ url, format, quality });

    // Start async download
    (async () => {
      try {
        jobStore.updateSingleJob(job.id, {
          status: 'running',
          message: 'Downloading...'
        });

        // Build temp directory
        const tempDir = path.join(os.tmpdir(), 'batchtube-single', job.id);
        fs.ensureDirSync(tempDir);

        // Build output path
        const ext = format === 'mp3' ? 'mp3' : 'mp4';
        const fileName = `download.${ext}`;
        const outputPath = path.join(tempDir, fileName);

        // Download
        await downloadWithYtDlp({
          url,
          format,
          quality,
          outputPath,
          onProgress: (percent, textLine) => {
            jobStore.updateSingleJob(job.id, {
              progress: Math.round(percent),
              message: `Downloading... ${Math.round(percent)}%`
            });
          }
        });

        // Wait a bit for file system sync
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find the actual downloaded file (yt-dlp may rename it)
        let actualFile = null;
        let actualPath = null;

        // Retry file detection
        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          try {
            if (!fs.existsSync(tempDir)) {
              continue;
            }

            const files = fs.readdirSync(tempDir);
            
            // Filter media files by format
            const mediaExtensions = format === 'mp3' 
              ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg']
              : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];

            const mediaFiles = files.filter(f => {
              const ext = path.extname(f).toLowerCase();
              return mediaExtensions.includes(ext);
            });

            if (mediaFiles.length === 0) {
              continue;
            }

            // Get file stats and sort by modification time (newest first)
            const filesWithStats = mediaFiles.map(f => {
              const filePath = path.join(tempDir, f);
              try {
                const stats = fs.statSync(filePath);
                return { 
                  path: filePath, 
                  name: f, 
                  size: stats.size, 
                  mtime: stats.mtime 
                };
              } catch (e) {
                return null;
              }
            }).filter(f => f !== null && f.size >= 100 * 1024); // At least 100KB

            if (filesWithStats.length === 0) {
              continue;
            }

            // Sort by modification time (newest first) and size (largest first)
            filesWithStats.sort((a, b) => {
              if (b.mtime.getTime() !== a.mtime.getTime()) {
                return b.mtime.getTime() - a.mtime.getTime();
              }
              return b.size - a.size;
            });

            // Prefer exact match, then newest/largest
            const found = filesWithStats.find(f => f.path === outputPath) || filesWithStats[0];
            
            if (found && found.size >= 100 * 1024) {
              actualFile = found.name;
              actualPath = found.path;
              break;
            }
          } catch (err) {
            console.error(`[Single] Error scanning directory (attempt ${attempt + 1}):`, err.message);
          }
        }

        if (!actualFile || !actualPath) {
          const files = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
          console.error(`[Single] File not found in ${tempDir}. Contents: ${files.join(', ')}`);
          throw new Error('Output file not found after download');
        }

        const stats = fs.statSync(actualPath);
        if (stats.size < 100 * 1024) {
          throw new Error('Downloaded file is too small');
        }

        // Register file
        const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        const fileId = fileStore.registerSingleFile(job.id, actualPath, actualFile, contentType);

        // Mark job completed
        jobStore.markJobCompleted(job.id, fileId);
        jobStore.updateSingleJob(job.id, {
          progress: 100,
          message: 'Download completed'
        });

      } catch (error) {
        console.error(`[Single] Download failed for job ${job.id}:`, error);
        jobStore.markJobError(job.id, error.message || 'Download failed');
      }
    })();

    res.json({ jobId: job.id });
  } catch (error) {
    console.error('[Single] Error:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

/**
 * GET /api/single-status/:jobId
 */
router.get('/single-status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobStore.getJob(jobId);

    if (!job || job.type !== 'single') {
      return res.json({
        jobId,
        status: 'error',
        message: 'job not found'
      });
    }

    const response = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message
    };

    if (job.status === 'completed' && job.fileId) {
      response.downloadUrl = `/api/single-file/${job.fileId}`;
    }

    if (job.status === 'error') {
      response.message = job.errorMessage || 'Download failed';
    }

    res.json(response);
  } catch (error) {
    console.error('[Single] Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * GET /api/single-file/:fileId
 */
router.get('/single-file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileRecord = fileStore.getSingleFile(fileId);

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { filePath, fileName, contentType } = fileRecord;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('end', async () => {
      // Delete file and cleanup after streaming
      await fileStore.deleteFileAndDir(fileRecord);
      fileStore.singleFiles.delete(fileId);
    });

    fileStream.on('error', async (err) => {
      console.error(`[Single] Stream error: ${err}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      } else {
        res.end();
      }
      await fileStore.deleteFileAndDir(fileRecord);
      fileStore.singleFiles.delete(fileId);
    });

  } catch (error) {
    console.error('[Single] File error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    } else {
      res.end();
    }
  }
});

export default router;


