/**
 * ZIP creation utility with chunked support
 */
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const MAX_PART_SIZE = 400 * 1024 * 1024; // 400 MB

/**
 * Create ZIP archive from files
 * @param {string} zipPath - Output ZIP file path
 * @param {Array<{filePath: string, fileName: string}>} files - Files to include
 * @returns {Promise<number>} ZIP file size in bytes
 */
function createZip(zipPath, files) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const zipSize = archive.pointer();
      if (zipSize < 100) {
        reject(new Error('ZIP file is too small'));
        return;
      }
      console.log(`[Zip] Created: ${zipPath} (${zipSize} bytes)`);
      resolve(zipSize);
    });

    archive.on('error', (err) => {
      console.error('[Zip] Creation error:', err);
      reject(err);
    });

    archive.pipe(output);

    files.forEach(file => {
      if (fs.existsSync(file.filePath)) {
        archive.file(file.filePath, { name: file.fileName });
      }
    });

    archive.finalize();
  });
}

/**
 * Create ZIP parts from files (universal format support)
 * Supports: .mp3, .mp4, .m4a, .webm, .wav, .flac, and any other format
 * @param {string} jobId - Job ID
 * @param {Array<{path: string, filename: string}>} files - Files to include
 * @returns {Promise<Array<{part: number, path: string, size: number}>>} Array of ZIP part info
 */
async function createZipParts(jobId, files) {
  // files = [{ path: "/tmp/...", filename: "xxx.mp4" }, ...]

  const MAX_SIZE = 400 * 1024 * 1024; // 400MB
  const dir = `/tmp/batchtube/${jobId}`;
  fs.mkdirSync(dir, { recursive: true });

  let part = 1;
  let currentSize = 0;

  let zipPath = `${dir}/${jobId}.part${part}.zip`;
  let output = fs.createWriteStream(zipPath);

  let archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  const parts = [];

  async function finalizePart() {
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const size = fs.statSync(zipPath).size;
        parts.push({ part, path: zipPath, size });
        console.log(`[Zip] Created part ${part} (${size} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        console.error(`[Zip] Part ${part} finalize error:`, err);
        reject(err);
      });

      archive.finalize();
    });
  }

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.warn(`[Zip] File not found: ${file.path}`);
      continue;
    }

    const stat = fs.statSync(file.path);
    const fileSize = stat.size;

    // If next file would exceed max, finalize and start new ZIP
    if (currentSize + fileSize > MAX_SIZE && currentSize > 0) {
      await finalizePart();

      part++;
      currentSize = 0;

      zipPath = `${dir}/${jobId}.part${part}.zip`;
      output = fs.createWriteStream(zipPath);
      archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);
    }

    // Preserve original file extension (works for any format)
    archive.file(file.path, { name: file.filename });
    currentSize += fileSize;
  }

  await finalizePart();
  
  console.log(`[Zip] Created ${parts.length} ZIP part(s) for job ${jobId}`);
  return parts;
}

module.exports = { createZip, createZipParts, MAX_PART_SIZE };

