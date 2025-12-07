/**
 * ZIP creation utility
 */
const archiver = require('archiver');
const fs = require('fs');

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

module.exports = { createZip };

