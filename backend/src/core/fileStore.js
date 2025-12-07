import path from 'path';
import fs from 'fs-extra';
import { generateId } from '../utils/id.js';

/**
 * FileStore - In-memory maps for file tracking
 */

class FileStore {
  constructor() {
    this.singleFiles = new Map(); // fileId -> { filePath, fileName, contentType, createdAt }
    this.batchFiles = new Map();   // fileId -> { filePath, fileName, contentType, createdAt }
    this.startCleanupInterval();
  }

  /**
   * Register a single download file
   * @param {string} jobId
   * @param {string} filePath
   * @param {string} fileName
   * @param {string} contentType
   * @returns {string} fileId
   */
  registerSingleFile(jobId, filePath, fileName, contentType) {
    const fileId = generateId();
    
    this.singleFiles.set(fileId, {
      filePath,
      fileName,
      contentType,
      createdAt: Date.now(),
      jobId
    });

    return fileId;
  }

  /**
   * Register a batch ZIP file
   * @param {string} jobId
   * @param {string} filePath
   * @param {string} fileName
   * @returns {string} fileId
   */
  registerBatchFile(jobId, filePath, fileName) {
    const fileId = generateId();
    
    this.batchFiles.set(fileId, {
      filePath,
      fileName,
      contentType: 'application/zip',
      createdAt: Date.now(),
      jobId
    });

    return fileId;
  }

  /**
   * Get single file record
   * @param {string} fileId
   * @returns {Object|null}
   */
  getSingleFile(fileId) {
    return this.singleFiles.get(fileId) || null;
  }

  /**
   * Get batch file record
   * @param {string} fileId
   * @returns {Object|null}
   */
  getBatchFile(fileId) {
    return this.batchFiles.get(fileId) || null;
  }

  /**
   * Delete file and its directory
   * @param {Object} fileRecord
   */
  async deleteFileAndDir(fileRecord) {
    if (!fileRecord || !fileRecord.filePath) return;

    try {
      const filePath = fileRecord.filePath;
      const fileDir = path.dirname(filePath);

      // Delete the file
      if (fs.existsSync(filePath)) {
        await fs.unlink(filePath);
      }

      // Delete the directory if it's empty or only contains the file
      if (fs.existsSync(fileDir)) {
        const files = fs.readdirSync(fileDir);
        if (files.length === 0 || (files.length === 1 && files[0] === path.basename(filePath))) {
          await fs.remove(fileDir);
        }
      }
    } catch (err) {
      console.error(`[FileStore] Error deleting file: ${err.message}`);
    }
  }

  /**
   * Cleanup expired files (older than 10 minutes)
   */
  async cleanupExpiredFiles() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    // Clean single files
    for (const [fileId, record] of this.singleFiles.entries()) {
      if (now - record.createdAt > maxAge) {
        await this.deleteFileAndDir(record);
        this.singleFiles.delete(fileId);
      }
    }

    // Clean batch files
    for (const [fileId, record] of this.batchFiles.entries()) {
      if (now - record.createdAt > maxAge) {
        await this.deleteFileAndDir(record);
        this.batchFiles.delete(fileId);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60 * 1000); // Every minute
  }
}

export const fileStore = new FileStore();


