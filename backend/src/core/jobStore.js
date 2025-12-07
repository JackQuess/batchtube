import { generateId } from '../utils/id.js';

/**
 * JobStore - In-memory store for download jobs
 */

// Types (for reference, JS doesn't enforce these)
// type JobStatus = "pending" | "running" | "zipping" | "completed" | "error";
// type JobType = "single" | "batch";

class JobStore {
  constructor() {
    this.jobs = new Map();
    this.startCleanupInterval();
  }

  /**
   * Create a single download job
   * @param {Object} params
   * @param {string} params.url - YouTube URL
   * @param {string} params.format - "mp3" | "mp4"
   * @param {string} params.quality - "1080p" | "4k"
   * @returns {Object} SingleJob
   */
  createSingleJob({ url, format, quality = "1080p" }) {
    const id = generateId();
    const now = Date.now();
    
    const job = {
      id,
      type: "single",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      url,
      format,
      quality,
      progress: 0,
      message: "Starting download...",
      fileId: null,
      errorMessage: null
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Update single job
   * @param {string} jobId
   * @param {Object} patch - Partial job update
   */
  updateSingleJob(jobId, patch) {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== "single") return;

    Object.assign(job, patch, { updatedAt: Date.now() });
  }

  /**
   * Create a batch download job
   * @param {Object} params
   * @param {Array} params.items - Array of { url, title? }
   * @param {string} params.format - "mp3" | "mp4"
   * @param {string} params.quality - "1080p" | "4k"
   * @returns {Object} BatchJob
   */
  createBatchJob({ items, format, quality = "1080p" }) {
    const id = generateId();
    const now = Date.now();

    const job = {
      id,
      type: "batch",
      status: "pending",
      createdAt: now,
      updatedAt: now,
      format,
      quality,
      items: items.map((item, index) => ({
        index,
        title: item.title || `Item ${index + 1}`,
        percent: 0,
        status: "pending"
      })),
      zipFileId: null,
      errorMessage: null
    };

    this.jobs.set(id, job);
    return job;
  }

  /**
   * Update batch item progress
   * @param {string} jobId
   * @param {number} index
   * @param {Object} patch - Partial item update
   */
  updateBatchItem(jobId, index, patch) {
    const job = this.jobs.get(jobId);
    if (!job || job.type !== "batch") return;

    const item = job.items[index];
    if (!item) return;

    Object.assign(item, patch);
    job.updatedAt = Date.now();
  }

  /**
   * Mark job as error
   * @param {string} jobId
   * @param {string} errorMessage
   */
  markJobError(jobId, errorMessage) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "error";
    job.errorMessage = errorMessage;
    job.updatedAt = Date.now();
  }

  /**
   * Update job status
   * @param {string} jobId
   * @param {string} status
   */
  updateJobStatus(jobId, status) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = status;
    job.updatedAt = Date.now();
  }

  /**
   * Mark job as completed
   * @param {string} jobId
   * @param {string} fileId - fileId or zipFileId
   */
  markJobCompleted(jobId, fileId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "completed";
    job.updatedAt = Date.now();

    if (job.type === "single") {
      job.fileId = fileId;
      job.progress = 100;
    } else if (job.type === "batch") {
      job.zipFileId = fileId;
    }
  }

  /**
   * Get job by ID
   * @param {string} jobId
   * @returns {Object|null}
   */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cleanup old jobs (older than 10 minutes)
   */
  cleanupOldJobs() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > maxAge) {
        this.jobs.delete(id);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldJobs();
    }, 60 * 1000); // Every minute
  }
}

export const jobStore = new JobStore();
