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
 * @param {string} basePath - Base path for ZIP files (without extension)
 * @param {Array<{filePath: string, fileName: string}>} files - Files to include
 * @returns {Promise<Array<{index: number, path: string, size: number}>>} Array of ZIP part info
 */
function createChunkedZips(basePath, files) {
  return new Promise(async (resolve, reject) => {
    const parts = [];
    let currentPartIndex = 1;
    let currentPartSize = 0;
    let currentArchive = null;
    let currentOutput = null;
    let currentPartPath = null;

    const startNewPart = () => {
      return new Promise((resolvePart, rejectPart) => {
        if (currentArchive) {
          currentArchive.finalize();
        }

        currentPartPath = `${basePath}.part${currentPartIndex}.zip`;
        currentOutput = fs.createWriteStream(currentPartPath);
        currentArchive = archiver('zip', { zlib: { level: 9 } });
        currentPartSize = 0;

        currentOutput.on('close', () => {
          const zipSize = currentArchive.pointer();
          if (zipSize < 100) {
            rejectPart(new Error(`ZIP part ${currentPartIndex} is too small`));
            return;
          }
          console.log(`[Zip] Created part ${currentPartIndex}: ${currentPartPath} (${zipSize} bytes)`);
          parts.push({
            index: currentPartIndex,
            path: currentPartPath,
            size: zipSize
          });
          resolvePart();
        });

        currentArchive.on('error', (err) => {
          console.error(`[Zip] Part ${currentPartIndex} creation error:`, err);
          rejectPart(err);
        });

        currentArchive.pipe(currentOutput);
      });
    };

    try {
      // Start first part
      await startNewPart();

      // Add files to parts
      for (const file of files) {
        if (!fs.existsSync(file.filePath)) {
          console.warn(`[Zip] File not found: ${file.filePath}`);
          continue;
        }

        const fileStats = fs.statSync(file.filePath);
        const fileSize = fileStats.size;

        // Check if adding this file would exceed the limit
        if (currentPartSize + fileSize > MAX_PART_SIZE && currentPartSize > 0) {
          // Finalize current part
          await new Promise((resolveFinalize) => {
            currentArchive.finalize();
            currentOutput.on('close', resolveFinalize);
          });

          // Start new part
          currentPartIndex++;
          await startNewPart();
        }

        // Add file to current archive
        currentArchive.file(file.filePath, { name: file.fileName });
        currentPartSize += fileSize;
      }

      // Finalize last part
      if (currentArchive) {
        await new Promise((resolveFinalize) => {
          currentArchive.finalize();
          currentOutput.on('close', resolveFinalize);
        });
      }

      if (parts.length === 0) {
        reject(new Error('No ZIP parts created'));
        return;
      }

      console.log(`[Zip] Created ${parts.length} ZIP part(s)`);
      resolve(parts);
    } catch (err) {
      console.error('[Zip] Chunked creation error:', err);
      reject(err);
    }
  });
}

module.exports = { createZip, createChunkedZips, MAX_PART_SIZE };

