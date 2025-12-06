import { generateId } from '../utils/id.js';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const TEMP_DIR = path.join(os.tmpdir(), 'batchtube-downloads');
fs.ensureDirSync(TEMP_DIR);

class JobStore {
  constructor() {
    this.jobs = new Map();
    this.startCleanupInterval();
  }

  createJob(items, type = 'batch') {
    const id = generateId();
    const jobDir = path.join(TEMP_DIR, id);
    fs.ensureDirSync(jobDir);

    const job = {
      id,
      type,
      status: 'queued',
      totalItems: items.length,
      completedItems: 0,
      overallPercent: 0,
      createdAt: Date.now(),
      items: items.map((item, index) => ({
        index,
        url: item.url,
        title: item.title || 'Unknown',
        format: item.format,
        quality: item.quality,
        status: 'queued',
        percent: 0,
        speed: '0 B/s',
        eta: '--',
        fileName: null,
        error: null,
        filePath: null
      })),
      downloadUrl: null,
      error: null
    };

    this.jobs.set(id, job);
    return job;
  }

  getJob(id) {
    return this.jobs.get(id);
  }

  updateItemProgress(jobId, itemIndex, progress) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const item = job.items[itemIndex];
    if (!item) return;

    Object.assign(item, progress);
    
    // Update overall progress
    const totalPercent = job.items.reduce((sum, i) => sum + i.percent, 0);
    job.overallPercent = Math.round(totalPercent / job.items.length);
    job.completedItems = job.items.filter(i => i.status === 'completed').length;

    // Update job status
    if (job.completedItems === job.totalItems && job.items.every(i => i.status === 'completed' || i.status === 'failed')) {
      job.status = 'processing';
    } else if (job.items.some(i => i.status === 'failed')) {
      if (job.items.every(i => i.status === 'failed')) {
        job.status = 'failed';
      } else {
        job.status = 'downloading';
      }
    } else {
      job.status = 'downloading';
    }
  }

  setJobDownloadUrl(jobId, downloadUrl) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.downloadUrl = downloadUrl;
      job.status = 'completed';
      job.overallPercent = 100;
    }
  }

  setJobError(jobId, error) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.error = error;
      job.status = 'failed';
    }
  }

  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldJobs();
    }, 60 * 60 * 1000);
  }

  async cleanupOldJobs() {
    const now = Date.now();
    // Clean up jobs older than 10 minutes (600000ms) for production
    const maxAge = 10 * 60 * 1000;

    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > maxAge) {
        this.jobs.delete(id);
        const jobDir = path.join(TEMP_DIR, id);
        if (fs.existsSync(jobDir)) {
          await fs.remove(jobDir).catch(err => {
            console.error(`[Cleanup] Error removing ${jobDir}:`, err);
          });
        }
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Cleanup] Removed job ${id}`);
        }
      }
    }
  }

  getTempDir() {
    return TEMP_DIR;
  }
}

export const jobStore = new JobStore();
