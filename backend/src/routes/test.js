import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ytdlp = path.resolve(__dirname, '../bin/yt-dlp');

export const handleTestYT = async (req, res) => {
  try {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const testOutput = '/tmp/test-yt-dlp.mp4';

    console.log('[Test] Testing yt-dlp installation...');
    console.log('[Test] Binary path:', ytdlp);
    console.log('[Test] Command:', ytdlp, testUrl, '-f', 'mp4', '-o', testOutput);

    // Check if binary exists
    if (!fs.existsSync(ytdlp)) {
      return res.status(500).json({
        success: false,
        error: `yt-dlp binary not found at ${ytdlp}`
      });
    }

    // Test yt-dlp version first
    const versionCheck = spawn(ytdlp, ['--version'], { shell: false });
    let versionOutput = '';
    
    versionCheck.stdout.on('data', (data) => {
      versionOutput += data.toString();
    });

    await new Promise((resolve, reject) => {
      versionCheck.on('close', (code) => {
        if (code === 0) {
          console.log('[Test] yt-dlp version:', versionOutput.trim());
          resolve();
        } else {
          reject(new Error('yt-dlp not found or not working'));
        }
      });
      versionCheck.on('error', reject);
    });

    // Clean up old test file if exists
    if (fs.existsSync(testOutput)) {
      fs.unlinkSync(testOutput);
    }

    // Run test download
    const child = spawn(ytdlp, [
      testUrl,
      '-f', 'mp4',
      '--no-playlist',
      '-o', testOutput
    ], { shell: false });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
          return;
        }
        resolve();
      });
      child.on('error', reject);
    });

    // Check if file exists and has content
    if (!fs.existsSync(testOutput)) {
      return res.status(500).json({
        success: false,
        error: 'Test file not created',
        stdout,
        stderr
      });
    }

    const stats = fs.statSync(testOutput);
    if (stats.size === 0) {
      fs.unlinkSync(testOutput);
      return res.status(500).json({
        success: false,
        error: 'Test file is empty',
        stdout,
        stderr
      });
    }

    // Clean up test file
    fs.unlinkSync(testOutput);

    res.json({
      success: true,
      message: 'yt-dlp test successful',
      version: versionOutput.trim(),
      fileSize: stats.size,
      output: testOutput
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
};

