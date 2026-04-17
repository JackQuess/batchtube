import fs from 'node:fs';
import path from 'node:path';

/**
 * Read file into buffer and remove the temp dir. Use after downloadWithYtDlp.
 */
export function readDownloadAndCleanup(result: { filePath: string }): { buffer: Buffer } {
  const buffer = fs.readFileSync(result.filePath);
  const dir = path.dirname(result.filePath);
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
  return { buffer };
}
