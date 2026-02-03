
import fs from 'fs-extra';
import archiver from 'archiver';
import path from 'path';

export const createZip = (sourceDir: string, outputFile: string, filesToZip: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Ensure parent dir exists
    fs.ensureDirSync(path.dirname(outputFile));

    const output = fs.createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    filesToZip.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: path.basename(filePath) });
      }
    });

    archive.finalize();
  });
};
