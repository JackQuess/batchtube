
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { JobItem } from '../types.js';

export const downloadItem = async (
  item: JobItem, 
  outputDir: string, 
  onProgress: (percent: number) => void
): Promise<string> => {
  
  // Ensure directory exists
  await fs.ensureDir(outputDir);

  // Sanitized filename
  const safeTitle = (item.title || item.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filenameTemplate = `${safeTitle}.%(ext)s`;
  const outputPath = path.join(outputDir, filenameTemplate);

  // Construct Arguments
  const args: string[] = [
    item.url,
    '--no-playlist',
    '--newline', // Critical for progress parsing
    '--progress',
    '-o', outputPath
  ];

  if (item.format === 'mp3') {
    // MP3 Command: yt-dlp -x --audio-format mp3 --audio-quality 320K
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '320K');
  } else {
    // MP4 Command
    if (item.quality === '4k') {
      // 4K: yt-dlp -f "bv*[height>=2160]+ba" --merge-output-format mp4
      args.push('-f', 'bv*[height>=2160]+ba', '--merge-output-format', 'mp4');
    } else {
      // Standard: yt-dlp -f "bv*[ext=mp4]+ba[ext=m4a]/mp4" --merge-output-format mp4
      args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/mp4', '--merge-output-format', 'mp4');
    }
  }

  return new Promise((resolve, reject) => {
    console.log(`[yt-dlp] Spawning: ${args.join(' ')}`);
    const child = spawn('yt-dlp', args);
    
    let finalPath = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      
      // 1. Parse Progress
      const progressMatch = text.match(/\[download\]\s+(\d+\.\d+)%/);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        onProgress(percent);
      }

      // 2. Parse Destination (to know the final filename)
      // Matches: [download] Destination: ... or [ExtractAudio] Destination: ...
      const destMatch = text.match(/Destination:\s+(.+)$/m) || text.match(/Merging formats into "(.+)"/);
      if (destMatch) {
        finalPath = destMatch[1].trim();
      }
      
      // Fallback for "Already downloaded"
      const alreadyMatch = text.match(/has already been downloaded/);
      if (alreadyMatch) {
         // Logic to guess path if it was already there, usually previous lines have it
         onProgress(100);
      }
    });

    child.stderr.on('data', (chunk) => {
      // yt-dlp writes non-fatal warnings to stderr, don't reject immediately
      // console.warn(`[yt-dlp stderr] ${chunk.toString()}`);
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Verification: If finalPath wasn't captured from stdout, try to construct it
        // This is a heuristic because yt-dlp output can vary
        if (!finalPath) {
           const ext = item.format === 'mp3' ? 'mp3' : 'mp4';
           finalPath = path.join(outputDir, `${safeTitle}.${ext}`);
        }
        resolve(finalPath);
      } else {
        reject(new Error(`yt-dlp process exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};
