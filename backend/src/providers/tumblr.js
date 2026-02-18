const path = require('path');
const fs = require('fs-extra');
const { sanitizeFilename } = require('../utils/helpers');
const ytAdapter = require('../utils/ytServiceAdapter');
const { ProviderError, mapCommonProviderError } = require('./shared');

function isTumblrUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase().includes('tumblr.com');
  } catch (_) {
    return false;
  }
}

async function resolveOutputFile(outDir, expectedPath, format) {
  if (fs.existsSync(expectedPath) && fs.statSync(expectedPath).size > 0) return expectedPath;
  const mediaExtensions = format === 'audio'
    ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg']
    : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];
  const files = (await fs.readdir(outDir)).filter((f) => mediaExtensions.includes(path.extname(f).toLowerCase()));
  if (!files.length) return null;
  const fileWithStats = await Promise.all(files.map(async (file) => {
    const filePath = path.join(outDir, file);
    try {
      const stats = await fs.stat(filePath);
      return { filePath, mtime: stats.mtimeMs, size: stats.size };
    } catch (_) {
      return null;
    }
  }));
  const sorted = fileWithStats.filter(Boolean).filter((f) => f.size > 0).sort((a, b) => b.mtime - a.mtime || b.size - a.size);
  return sorted[0]?.filePath || null;
}

const tumblrProvider = {
  id: 'tumblr',

  match(url) {
    return isTumblrUrl(url);
  },

  async getMetadata(url) {
    try {
      const info = await ytAdapter.getInfo(url);
      return {
        platform: 'tumblr',
        url,
        id: info.id,
        title: info.title,
        channel: info.channel,
        durationSeconds: info.durationSeconds,
        thumbnail: info.thumbnail
      };
    } catch (error) {
      throw mapCommonProviderError(error, 'METADATA_FAILED');
    }
  },

  async download(url, opts) {
    const outDir = opts.outDir;
    const format = opts.format === 'audio' ? 'audio' : 'video';
    const ext = format === 'audio' ? 'mp3' : 'mp4';
    const baseName = sanitizeFilename(opts.baseName || 'tumblr_media');
    const expectedPath = path.join(outDir, `${baseName}.${ext}`);
    try {
      await ytAdapter.download(url, {
        outDir,
        format,
        quality: opts.quality,
        baseName,
        onProgress: opts.onProgress
      });
      const actualPath = await resolveOutputFile(outDir, expectedPath, format);
      if (!actualPath) throw new ProviderError('DOWNLOAD_FAILED', 'Output file not found after download');
      const finalPath = actualPath === expectedPath ? actualPath : expectedPath;
      if (actualPath !== expectedPath) {
        if (await fs.pathExists(expectedPath)) await fs.remove(expectedPath);
        await fs.move(actualPath, expectedPath);
      }
      const stat = await fs.stat(finalPath);
      return { filePath: finalPath, fileName: path.basename(finalPath), bytes: stat.size };
    } catch (error) {
      throw mapCommonProviderError(error, 'DOWNLOAD_FAILED');
    }
  }
};

module.exports = {
  tumblrProvider
};
