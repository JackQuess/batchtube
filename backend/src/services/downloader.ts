import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { DownloadJob, DownloadItem } from '../types.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.resolve('temp_downloads');

// Ensure temp dir exists on startup
fs.ensureDirSync(TEMP_DIR);

class DownloadManager {
  private jobs: Map<string, DownloadJob> = new Map();
  private MAX_CONCURRENT_BATCH_ITEMS = 3;

  constructor() {
    // Cleanup interval: remove jobs older than 1 hour
    setInterval(() => this.cleanupOldJobs(), 60 * 60 * 1000);
  }

  getJob(id: string) {
    return this.jobs.get(id);
  }

  createJob(items: { videoId: string, format: 'mp3' | 'mp4', title: string }[], type: 'single' | 'batch'): string {
    const id = uuidv4();
    const jobDir = path.join(TEMP_DIR, id);
    fs.ensureDirSync(jobDir);

    const job: DownloadJob = {
      id,
      type,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      items: items.map(i => ({
        url: `https://www.youtube.com/watch?v=${i.videoId}`,
        videoId: i.videoId,
        format: i.format,
        status: 'queued',
        progress: 0,
        title: i.title
      })),
      meta: {
        zipName: type === 'batch' ? `BatchTube_${Date.now()}.zip` : undefined
      }
    };

    this.jobs.set(id, job);
    this.processJob(id);
    return id;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'downloading';

    if (job.type === 'single') {
      await this.processItem(job, job.items[0], path.join(TEMP_DIR, jobId));
      if (job.items[0].status === 'completed') {
        job.status = 'completed';
        job.progress = 100;
        job.resultUrl = job.items[0].filePath; 
      } else {
        job.status = 'failed';
      }
    } else {
      // Parallel Batch Processing
      const pendingItems = [...job.items];
      const activePromises: Promise<void>[] = [];

      while (pendingItems.length > 0 || activePromises.length > 0) {
        while (pendingItems.length > 0 && activePromises.length < this.MAX_CONCURRENT_BATCH_ITEMS) {
          const item = pendingItems.shift()!;
          const p = this.processItem(job, item, path.join(TEMP_DIR, jobId)).then(() => {
            activePromises.splice(activePromises.indexOf(p), 1);
            this.updateBatchProgress(job);
          });
          activePromises.push(p);
        }
        if (activePromises.length > 0) {
          await Promise.race(activePromises);
        }
      }

      await this.createZip(job);
    }
  }

  private async processItem(job: DownloadJob, item: DownloadItem, outputDir: string): Promise<void> {
    item.status = 'downloading';
    
    return new Promise((resolve) => {
      const safeTitle = (item.title || item.videoId).replace(/[^a-z0-9]/gi, '_');
      const filenameTemplate = `${safeTitle}.%(ext)s`;
      
      const args = [
        item.url,
        '-o', path.join(outputDir, filenameTemplate),
        '--no-playlist',
        '--newline',
        '--progress',
      ];

      if (item.format === 'mp3') {
        args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
      } else {
        // Force MP4 container for better compatibility
        args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
      }

      console.log(`[Spawn] yt-dlp for ${item.videoId}`);
      const child = spawn('yt-dlp', args);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        // Extract progress
        const match = text.match(/\[download\]\s+(\d+\.\d+)%/);
        if (match) {
          item.progress = parseFloat(match[1]);
          if (job.type === 'single') job.progress = item.progress;
        }
        
        // Extract filename
        const fileMatch = text.match(/\[download\] Destination: (.+)/) || text.match(/\[ExtractAudio\] Destination: (.+)/);
        if (fileMatch) {
            item.filePath = fileMatch[1];
        }
        // Handle "Already downloaded"
        const existingMatch = text.match(/\[download\] (.+) has already been downloaded/);
        if (existingMatch) {
            item.filePath = existingMatch[1];
            item.progress = 100;
        }
      });

      child.stderr.on('data', (data) => {
        // Optional: Log stderr for debug if needed, but yt-dlp prints progress to stdout often
      });

      child.on('close', (code) => {
        if (code === 0) {
          item.status = 'completed';
          item.progress = 100;
          // Heuristic fallback for filename if not caught
          if (!item.filePath) {
             const ext = item.format === 'mp3' ? 'mp3' : 'mp4';
             item.filePath = path.join(outputDir, `${safeTitle}.${ext}`);
          }
        } else {
          item.status = 'failed';
          console.error(`[Download Failed] ID: ${item.videoId} Code: ${code}`);
        }
        resolve();
      });

      child.on('error', (err) => {
        console.error('[Spawn Error] Ensure yt-dlp is installed:', err);
        item.status = 'failed';
        resolve();
      });
    });
  }

  private updateBatchProgress(job: DownloadJob) {
    const total = job.items.length * 100;
    const current = job.items.reduce((acc, item) => acc + item.progress, 0);
    // Reserve last 5% for ZIP creation
    job.progress = Math.round((current / total) * 95); 
  }

  private async createZip(job: DownloadJob) {
    // Check if any items succeeded
    const validItems = job.items.filter(i => i.status === 'completed' && i.filePath && fs.existsSync(i.filePath));
    
    if (validItems.length === 0) {
        job.status = 'failed';
        job.error = 'No items downloaded successfully';
        return;
    }

    job.status = 'processing';
    const jobDir = path.join(TEMP_DIR, job.id);
    const zipPath = path.join(jobDir, job.meta.zipName!);
    
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise<void>((resolve, reject) => {
      output.on('close', () => {
        job.status = 'completed';
        job.progress = 100;
        job.resultUrl = zipPath;
        resolve();
      });

      archive.on('error', (err) => {
        job.status = 'failed';
        job.error = 'Zip creation failed';
        console.error('[Zip Error]', err);
        reject(err);
      });

      archive.pipe(output);

      validItems.forEach(item => {
        if (item.filePath) {
            archive.file(item.filePath, { name: path.basename(item.filePath) });
        }
      });

      archive.finalize();
    });
  }

  private async cleanupOldJobs() {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > 3600000) { // 1 hour
        this.jobs.delete(id);
        await fs.remove(path.join(TEMP_DIR, id));
        console.log(`[Cleanup] Removed job ${id}`);
      }
    }
  }
}

export const downloadManager = new DownloadManager();