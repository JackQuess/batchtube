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
 * Create chunked ZIP archives from files
 * @param {string} jobId - Job ID
 * @param {Array<{path: string, filename: string}>} files - Files to include
 * @returns {Promise<Array<{index: number, path: string, size: number}>>} Array of ZIP part info
 */
async function createChunkedZip(jobId, files) {
  const MAX_PART_SIZE = 400 * 1024 * 1024; // 400 MB
  const baseDir = `/tmp/batchtube/${jobId}`;
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  let partIndex = 1;
  let currentSize = 0;

  let output = fs.createWriteStream(`${baseDir}/${jobId}.part${partIndex}.zip`);
  let archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(output);

  const zipParts = [];

  async function finalizeCurrentZip() {
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const partPath = `${baseDir}/${jobId}.part${partIndex}.zip`;
        const partSize = fs.statSync(partPath).size;
        zipParts.push({
          index: partIndex,
          path: partPath,
          size: partSize
        });
        console.log(`[Zip] Part ${partIndex} created: ${partPath} (${partSize} bytes)`);
        resolve();
      });

      archive.on('error', (err) => {
        console.error(`[Zip] Part ${partIndex} finalize error:`, err);
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

    const fileSize = fs.statSync(file.path).size;

    if (currentSize + fileSize > MAX_PART_SIZE && currentSize > 0) {
      await finalizeCurrentZip();

      partIndex++;
      currentSize = 0;

      output = fs.createWriteStream(`${baseDir}/${jobId}.part${partIndex}.zip`);
      archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(output);
    }

    archive.file(file.path, { name: file.filename });
    currentSize += fileSize;
  }

  await finalizeCurrentZip();
  
  console.log(`[Zip] Created ${zipParts.length} ZIP part(s) for job ${jobId}`);
  return zipParts;
}

module.exports = { createZip, createChunkedZip, MAX_PART_SIZE };

