
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import pLimit from 'p-limit';
import { progressStore } from './progressStore.js';
import { downloadItem } from './ytService.js';
import { createZip } from '../utils/zipFile.js';
import { DownloadRequestItem, JobState, JobItem } from '../types.js';

const DOWNLOADS_ROOT = path.resolve('downloads');
const TEMP_ROOT = path.resolve('temp');

// Ensure roots exist
fs.ensureDirSync(DOWNLOADS_ROOT);
fs.ensureDirSync(TEMP_ROOT);

export const startBatchJob = (items: DownloadRequestItem[]): string => {
  const jobId = uuidv4();
  const jobDir = path.join(TEMP_ROOT, jobId);
  
  // 1. Initialize Job State
  const jobState: JobState = {
    jobId,
    type: items.length > 1 ? 'batch' : 'single',
    status: 'queued',
    totalItems: items.length,
    completedItems: 0,
    progress: 0,
    items: items.map(i => ({
      id: uuidv4(),
      url: i.url,
      format: i.format,
      quality: i.quality || 'best',
      status: 'queued',
      progress: 0,
      title: i.title
    })),
    createdAt: Date.now(),
    zipName: `BatchTube_${Date.now()}.zip`
  };

  progressStore.set(jobId, jobState);

  // 2. Start Processing (Async)
  processBatch(jobId, jobDir).catch(err => {
    console.error(`[Batch Error] Job ${jobId}:`, err);
    jobState.status = 'failed';
    progressStore.set(jobId, jobState);
  });

  return jobId;
};

const processBatch = async (jobId: string, jobDir: string) => {
  const job = progressStore.get(jobId);
  if (!job) return;

  job.status = 'downloading';
  progressStore.set(jobId, job);

  // Concurrency Limit: 4
  const limit = pLimit(4);

  // Map items to promises
  const tasks = job.items.map(item => {
    return limit(async () => {
      item.status = 'downloading';
      try {
        const filePath = await downloadItem(item, jobDir, (percent) => {
          item.progress = percent;
          progressStore.updateGlobalProgress(jobId);
        });
        
        item.status = 'completed';
        item.progress = 100;
        item.filePath = filePath;
        job.completedItems++;
      } catch (error: any) {
        console.error(`Item failed: ${item.url}`, error);
        item.status = 'failed';
        item.error = error.message;
      } finally {
        progressStore.updateGlobalProgress(jobId);
      }
    });
  });

  // Wait for all downloads
  await Promise.all(tasks);

  // 3. Finalize (Zip or Single File)
  if (job.items.every(i => i.status === 'failed')) {
    job.status = 'failed';
    progressStore.set(jobId, job);
    return;
  }

  job.status = 'processing'; // Zipping
  progressStore.set(jobId, job);

  try {
    if (job.type === 'single') {
      // Single file - just point to the file in temp (or move it to downloads, but serving from temp is fine for this architecture if we map the route correctly)
      // Let's move single files to DOWNLOADS_ROOT to keep temp cleanable
      const item = job.items[0];
      if (item.filePath && fs.existsSync(item.filePath)) {
        const fileName = path.basename(item.filePath);
        const finalPath = path.join(DOWNLOADS_ROOT, fileName);
        await fs.move(item.filePath, finalPath, { overwrite: true });
        job.downloadUrl = `/api/download/${fileName}`;
      }
    } else {
      // Batch - Create Zip
      const zipName = job.zipName || `${jobId}.zip`;
      const zipPath = path.join(DOWNLOADS_ROOT, zipName);
      
      const successfulFiles = job.items
        .filter(i => i.status === 'completed' && i.filePath)
        .map(i => i.filePath!);

      await createZip(jobDir, zipPath, successfulFiles);
      job.downloadUrl = `/api/download/${zipName}`;
    }

    job.status = 'completed';
    job.progress = 100;
  } catch (err) {
    console.error('Finalization error:', err);
    job.status = 'failed';
  }

  // Cleanup Temp
  await fs.remove(jobDir);
  progressStore.set(jobId, job);
};
