const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const http = require('http');
const https = require('https');
const { sanitizeFilename } = require('../utils/helpers');
const { ProviderError } = require('./shared');

const DIRECT_EXTENSIONS = ['.mp4', '.mp3', '.webm', '.m4a', '.mov'];

function getExtensionFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    return path.extname(pathname).toLowerCase();
  } catch (_) {
    return '';
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
    return {
      platform: 'generic',
      url,
      title: 'Direct media'
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
