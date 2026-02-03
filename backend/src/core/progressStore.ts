
import { JobState } from '../types.js';

class ProgressStore {
  private jobs: Map<string, JobState> = new Map();

  // Create or Update
  set(jobId: string, data: JobState) {
    this.jobs.set(jobId, data);
  }

  // Read
  get(jobId: string): JobState | undefined {
    return this.jobs.get(jobId);
  }

  // Global Progress Calculator
  updateGlobalProgress(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (job.items.length === 0) {
      job.progress = 0;
      return;
    }

    const totalProgress = job.items.reduce((acc, item) => acc + item.progress, 0);
    const average = totalProgress / job.items.length;
    
    // If we are zipping, cap visual progress at 95% until zip is done
    if (job.status === 'processing') {
      job.progress = 95;
    } else if (job.status === 'completed') {
      job.progress = 100;
    } else {
      job.progress = Math.round(average);
    }
  }

  // Cleanup old jobs
  cleanup(maxAgeMs = 3600000) { // 1 hour
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > maxAgeMs) {
        this.jobs.delete(id);
      }
    }
  }
}

export const progressStore = new ProgressStore();
