const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const http = require('http');
const https = require('https');
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
    if (ext === '.m3u8') {
      throw new ProviderError('UNSUPPORTED_URL', 'M3U8 not supported yet', 'Use a direct media file URL.');
    }

    if (!DIRECT_EXTENSIONS.includes(ext)) {
      throw new ProviderError(
        'UNSUPPORTED_URL',
        'Unsupported direct media URL',
        'Supported: mp4, mp3, webm, m4a, mov.'
      );
    }

    const safeName = sanitizeFilename(opts.baseName || `media_${Date.now()}`);
    const fileName = `${safeName}${ext}`;
    const filePath = path.join(opts.outDir, fileName);

    fsExtra.ensureDirSync(opts.outDir);
    await streamToFile(url, filePath);

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
