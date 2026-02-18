const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const { sanitizeFilename } = require('../utils/helpers');
const { ProviderError } = require('./shared');

const DIRECT_EXTENSIONS = ['.mp4', '.mp3', '.webm', '.m4a', '.mov'];

const GENERIC_THUMBNAIL_DATA_URI = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22640%22 height=%22360%22 viewBox=%220 0 640 360%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%220f172a%22/%3E%3Cstop offset=%221%22 stop-color=%231e293b%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22640%22 height=%22360%22 fill=%22url(%23g)%22/%3E%3Ccircle cx=%22320%22 cy=%22180%22 r=%2252%22 fill=%22rgba(255,255,255,.15)%22/%3E%3Cpolygon points=%22303,151 303,209 353,180%22 fill=%22%23ffffff%22/%3E%3Ctext x=%22320%22 y=%22302%22 text-anchor=%22middle%22 fill=%22%23e2e8f0%22 font-family=%22Arial,sans-serif%22 font-size=%2222%22%3EDirect Media%3C/text%3E%3C/svg%3E';

function getExtensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    return path.extname(pathname).toLowerCase();
  } catch (_) {
    return '';
  }
}

function isM3u8Url(url) {
  try {
    const parsed = new URL(url);
    const pathAndQuery = `${parsed.pathname || ''}${parsed.search || ''}`.toLowerCase();
    return pathAndQuery.includes('.m3u8');
  } catch (_) {
    return String(url || '').toLowerCase().includes('.m3u8');
  }
}

function getReadableTitleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const decoded = decodeURIComponent(path.basename(pathname));
    const rawName = decoded.replace(/\.[^.]+$/, '').trim();
    if (!rawName) return 'Direct media';
    const label = rawName
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return label || 'Direct media';
  } catch (_) {
    return 'Direct media';
  }
}

function streamToFile(url, filePath) {
  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectedUrl = new URL(response.headers.location, url).toString();
        response.destroy();
        streamToFile(redirectedUrl, filePath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new ProviderError('DOWNLOAD_FAILED', `HTTP ${response.statusCode} while downloading`));
        return;
      }

      const output = fs.createWriteStream(filePath);
      response.pipe(output);

      output.on('finish', () => output.close(resolve));
      output.on('error', reject);
      response.on('error', reject);
    });

    request.on('error', reject);
  });
}

function downloadM3u8ToMp4(url, filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', url,
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      filePath
    ];

    const child = spawn('ffmpeg', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new ProviderError('DOWNLOAD_FAILED', `Failed to start ffmpeg: ${err.message}`));
    });

    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
      reject(new ProviderError('DOWNLOAD_FAILED', 'M3U8 download timed out'));
    }, 15 * 60 * 1000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const details = (stderr || stdout || '').trim();
        reject(new ProviderError('DOWNLOAD_FAILED', details || `ffmpeg exited with code ${code}`));
        return;
      }

      if (!fs.existsSync(filePath)) {
        reject(new ProviderError('DOWNLOAD_FAILED', 'M3U8 output file not found after ffmpeg run'));
        return;
      }

      resolve();
    });
  });
}

const genericProvider = {
  id: 'generic',

  match() {
    return true;
  },

  async getMetadata(url) {
    const title = getReadableTitleFromUrl(url);
    return {
      platform: 'generic',
      url,
      title,
      channel: 'Direct link',
      thumbnail: GENERIC_THUMBNAIL_DATA_URI
    };
  },

  async download(url, opts) {
    const ext = getExtensionFromUrl(url);
    const isM3u8 = ext === '.m3u8' || isM3u8Url(url);

    if (!isM3u8 && !DIRECT_EXTENSIONS.includes(ext)) {
      throw new ProviderError(
        'UNSUPPORTED_URL',
        'Unsupported direct media URL',
        'Supported: mp4, mp3, webm, m4a, mov, m3u8.'
      );
    }

    const safeName = sanitizeFilename(opts.baseName || `media_${Date.now()}`);
    const outputExt = isM3u8 ? '.mp4' : ext;
    const fileName = `${safeName}${outputExt}`;
    const filePath = path.join(opts.outDir, fileName);

    fsExtra.ensureDirSync(opts.outDir);
    if (isM3u8) {
      await downloadM3u8ToMp4(url, filePath);
    } else {
      await streamToFile(url, filePath);
    }

    const stat = fs.statSync(filePath);
    return {
      filePath,
      fileName,
      bytes: stat.size
    };
  }
};

module.exports = {
  genericProvider
};
