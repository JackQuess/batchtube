import { YTService } from './ytService.js';
import { jobStore } from './jobStore.js';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import pLimit from 'p-limit';

const limit = pLimit(4);

class BatchEngine {
  async processJob(jobId) {
    const job = jobStore.getJob(jobId);
    if (!job) {
      console.error(`[BatchEngine] Job ${jobId} not found`);
      return;
    }

    const jobDir = path.join(jobStore.getTempDir(), jobId);
    const fileDir = path.join(jobDir, 'files');
    fs.ensureDirSync(fileDir);

    job.status = 'downloading';
    console.log(`[BatchEngine] Processing job ${jobId} with ${job.items.length} items`);

    // Download all items in parallel with p-limit(3)
    const tasks = job.items.map(item =>
      limit(() => this.downloadItem(jobId, item, fileDir))
    );

    await Promise.allSettled(tasks);

    // Check if any items succeeded
    const successfulItems = job.items.filter(i => i.status === 'completed' && i.filePath && fs.existsSync(i.filePath));
    
    if (successfulItems.length === 0) {
      jobStore.setJobError(jobId, 'No items downloaded successfully');
      return;
    }

    // Create ZIP file on disk
    await this.createZip(jobId, successfulItems, jobDir);
  }

  async downloadItem(jobId, item, fileDir) {
    const job = jobStore.getJob(jobId);
    if (!job) return;

    jobStore.updateItemProgress(jobId, item.index, {
      status: 'downloading',
      percent: 0
    });

    try {
      // Create unique base name with index to avoid clashes in parallel downloads
      const safeTitle = (item.title || 'video').replace(/[^a-z0-9]/gi, '_').substring(0, 100);
      const baseName = `${item.index}_${safeTitle}`;
      const ext = item.format === 'mp3' ? 'mp3' : 'mp4';
      // Use full path with extension (ytService will convert to base path internally)
      const outputPath = path.join(fileDir, `${baseName}.${ext}`);

      const result = await YTService.downloadVideo(
        item.url,
        outputPath,
        item.format,
        (progress) => {
          jobStore.updateItemProgress(jobId, item.index, {
            ...progress,
            status: 'downloading'
          });
        }
      );

      jobStore.updateItemProgress(jobId, item.index, {
        status: 'completed',
        percent: 100,
        filePath: result.filePath,
        fileName: path.basename(result.filePath)
      });

      return { success: true, item };
    } catch (error) {
      console.error(`[BatchEngine] Download failed for item ${item.index}:`, error);
      jobStore.updateItemProgress(jobId, item.index, {
        status: 'failed',
        error: error.message || 'Download failed'
      });
      return { success: false, item, error: error.message };
    }
  }

  async createZip(jobId, items, jobDir) {
    const job = jobStore.getJob(jobId);
    if (!job) return;

    console.log(`[BatchEngine] Creating ZIP for job ${jobId} with ${items.length} files`);

    const zipPath = path.join(jobDir, 'result.zip');

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const downloadUrl = `/api/download-file/${jobId}`;
        jobStore.setJobDownloadUrl(jobId, downloadUrl);
        job.status = 'completed';
        job.overallPercent = 100;
        console.log(`[BatchEngine] ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        console.error('[BatchEngine] ZIP creation error:', err);
        jobStore.setJobError(jobId, 'ZIP creation failed');
        reject(err);
      });

      archive.pipe(output);

      items.forEach(item => {
        if (item.filePath && fs.existsSync(item.filePath)) {
          archive.file(item.filePath, { name: item.fileName || path.basename(item.filePath) });
        }
      });

      archive.finalize();
    });
  }
}

export const batchEngine = new BatchEngine();
