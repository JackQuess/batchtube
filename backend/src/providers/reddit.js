const path = require('path');
const fs = require('fs-extra');
const { sanitizeFilename } = require('../utils/helpers');
const ytAdapter = require('../utils/ytServiceAdapter');
const { ProviderError, mapCommonProviderError } = require('./shared');

function isRedditUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.includes('reddit.com') || host.includes('redd.it') || host.includes('v.redd.it');
  } catch (_) {
    return false;
  }
}

function mapRedditError(error, fallbackCode) {
  const text = String(error?.message || error || '');
  const lower = text.toLowerCase();

  if (lower.includes('requested format is not available') || lower.includes('no video formats found')) {
    return new ProviderError(
      'UNSUPPORTED_URL',
      text || 'This Reddit URL has no downloadable video stream',
      'Use a Reddit post that contains video (v.redd.it).'
    );
  }

  if (lower.includes('private') || lower.includes('quarantined')) {
    return new ProviderError(
      'RESTRICTED',
      text || 'Reddit content is restricted',
      'This post may be private, quarantined, or unavailable.'
    );
  }

  return mapCommonProviderError(error, fallbackCode || 'UNKNOWN');
}

async function resolveOutputFile(outDir, expectedPath, format) {
  if (fs.existsSync(expectedPath) && fs.statSync(expectedPath).size > 0) return expectedPath;
  const mediaExtensions = format === 'audio' ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg'] : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];
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

const redditProvider = {
  id: 'reddit',

  match(url) {
    return isRedditUrl(url);
  },

  async getMetadata(url) {
    try {
      const info = await ytAdapter.getInfo(url);
      return {
        platform: 'reddit',
        url,
        id: info.id,
        title: info.title,
        channel: info.channel,
        durationSeconds: info.durationSeconds,
        thumbnail: info.thumbnail
      };
    } catch (error) {
      throw mapRedditError(error, 'METADATA_FAILED');
    }
  },

  async download(url, opts) {
    const outDir = opts.outDir;
    const format = opts.format === 'audio' ? 'audio' : 'video';
    const ext = format === 'audio' ? 'mp3' : 'mp4';
    const baseName = sanitizeFilename(opts.baseName || 'reddit_media');
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
      throw mapRedditError(error, 'DOWNLOAD_FAILED');
    }
  }
};

module.exports = {
  redditProvider
};
