import { downloadVideo, downloadAudio } from './ytService.js';
import { jobStore } from './jobStore.js';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import pLimit from 'p-limit';

const limit = pLimit(3); // Concurrency limit = 3

class BatchEngine {
  /**
   * Process a batch download job
   * @param {string} jobId - Job ID
   */
  async processJob(jobId) {
    const job = jobStore.getJob(jobId);
    if (!job) {
      console.error(`[BatchEngine] Job ${jobId} not found`);
      return;
    }

    const jobDir = path.join(jobStore.getTempDir(), jobId);
    const filesDir = path.join(jobDir, 'files');
    fs.ensureDirSync(filesDir);

    job.status = 'downloading';
    console.log(`[BatchEngine] Processing job ${jobId} with ${job.items.length} items`);

    // Process all items in parallel with concurrency limit
    const tasks = job.items.map(item =>
      limit(() => this.downloadItem(jobId, item, filesDir))
    );

    await Promise.allSettled(tasks);

    // Collect successful downloads
    const successfulItems = job.items.filter(
      i => i.status === 'completed' && i.filePath && fs.existsSync(i.filePath)
    );

    if (successfulItems.length === 0) {
      jobStore.setJobError(jobId, 'No items downloaded successfully');
      return;
    }

    // Create ZIP file
    await this.createZip(jobId, successfulItems, jobDir);
  }

  /**
   * Download a single item
   * @param {string} jobId - Job ID
   * @param {Object} item - Item to download
   * @param {string} filesDir - Directory to save files
   */
  async downloadItem(jobId, item, filesDir) {
    const job = jobStore.getJob(jobId);
    if (!job) return;

    // Create unique subdirectory for this item to avoid filename conflicts
    const itemDir = path.join(filesDir, `item_${item.index}`);
    fs.ensureDirSync(itemDir);

    jobStore.updateItemProgress(jobId, item.index, {
      status: 'downloading',
      percent: 0
    });

    try {
      let filePath;

      if (item.format === 'mp3') {
        filePath = await downloadAudio({
          url: item.url,
          outputDir: itemDir
        });
      } else {
        filePath = await downloadVideo({
          url: item.url,
          quality: item.quality || '1080p',
          outputDir: itemDir
        });
      }

      // Verify file exists and has valid size
      if (!fs.existsSync(filePath)) {
        throw new Error('Downloaded file not found');
      }

      const stats = fs.statSync(filePath);
      if (stats.size < 100 * 1024) {
        throw new Error(`File too small: ${stats.size} bytes`);
      }

      // Move file to filesDir with sanitized name
      const fileName = path.basename(filePath);
      const sanitizedFileName = this.sanitizeFilename(`${item.index}_${item.title || 'video'}_${fileName}`);
      const finalPath = path.join(filesDir, sanitizedFileName);

      // If file is already in filesDir, just rename it
      if (path.dirname(filePath) === filesDir) {
        if (filePath !== finalPath) {
          fs.moveSync(filePath, finalPath, { overwrite: true });
        }
      } else {
        fs.copySync(filePath, finalPath);
      }

      // Clean up item directory
      fs.removeSync(itemDir);

      jobStore.updateItemProgress(jobId, item.index, {
        status: 'completed',
        percent: 100,
        filePath: finalPath,
        fileName: sanitizedFileName
      });

      return { success: true, item, filePath: finalPath };
    } catch (error) {
      console.error(`[BatchEngine] Download failed for item ${item.index}:`, error);
      
      // Clean up item directory on error
      if (fs.existsSync(itemDir)) {
        fs.removeSync(itemDir).catch(() => {});
      }

      jobStore.updateItemProgress(jobId, item.index, {
        status: 'failed',
        error: error.message || 'Download failed'
      });

      return { success: false, item, error: error.message };
    }
  }

  /**
   * Create ZIP file from downloaded items
   * @param {string} jobId - Job ID
   * @param {Array} items - Successful items
   * @param {string} jobDir - Job directory
   */
  async createZip(jobId, items, jobDir) {
    const job = jobStore.getJob(jobId);
    if (!job) return;

    console.log(`[BatchEngine] Creating ZIP for job ${jobId} with ${items.length} files`);

    const zipPath = path.join(jobDir, 'result.zip');

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const zipSize = archive.pointer();
        console.log(`[BatchEngine] ZIP created: ${zipPath} (${zipSize} bytes)`);

        if (zipSize < 100) {
          console.error(`[BatchEngine] ZIP file is too small: ${zipSize} bytes`);
          jobStore.setJobError(jobId, 'ZIP creation failed: file too small');
          reject(new Error('ZIP file is too small'));
          return;
        }

        const downloadUrl = `/api/download-file/${jobId}`;
        jobStore.setJobDownloadUrl(jobId, downloadUrl);
        resolve();
      });

      archive.on('error', (err) => {
        console.error('[BatchEngine] ZIP creation error:', err);
        jobStore.setJobError(jobId, 'ZIP creation failed');
        reject(err);
      });

      archive.pipe(output);

      // Add all files to ZIP
      items.forEach(item => {
        if (item.filePath && fs.existsSync(item.filePath)) {
          const fileName = item.fileName || path.basename(item.filePath);
          archive.file(item.filePath, { name: fileName });
        }
      });

      archive.finalize();
    });
  }

  /**
   * Sanitize filename
   */
  sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 200)
      .trim();
  }
}

export const batchEngine = new BatchEngine();
