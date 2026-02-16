const path = require('path');
const fs = require('fs-extra');
const { sanitizeFilename } = require('../utils/helpers');
const ytAdapter = require('../utils/ytServiceAdapter');
const { ProviderError, mapCommonProviderError } = require('./shared');

function isTwitterUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.includes('twitter.com') || host.includes('x.com');
  } catch (_) {
    return false;
  }
}

function normalizeTwitterUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('x.com')) {
      parsed.hostname = 'twitter.com';
      return parsed.toString();
    }
    return url;
  } catch (_) {
    return url;
  }
}

function mapTwitterError(error, fallbackCode) {
  const text = String(error?.message || error || '');
  const lower = text.toLowerCase();

  if (lower.includes('login required') || lower.includes('requires authentication')) {
    return new ProviderError(
      'NEEDS_VERIFICATION',
      text || 'Twitter/X requires verification',
      'This post may require login or additional verification.'
    );
  }

  if (lower.includes('private') || lower.includes('protected')) {
    return new ProviderError(
      'RESTRICTED',
      text || 'Protected Twitter/X content',
      'This post is likely not publicly accessible.'
    );
  }

  return mapCommonProviderError(error, fallbackCode || 'UNKNOWN');
}

async function resolveOutputFile(outDir, expectedPath, format) {
  if (fs.existsSync(expectedPath) && fs.statSync(expectedPath).size > 0) {
    return expectedPath;
  }

  const mediaExtensions = format === 'audio'
    ? ['.mp3', '.m4a', '.opus', '.webm', '.ogg']
    : ['.mp4', '.mkv', '.webm', '.m4v', '.mov'];

  const files = (await fs.readdir(outDir)).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return mediaExtensions.includes(ext);
  });

  if (!files.length) return null;

  const fileWithStats = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(outDir, file);
      try {
        const stats = await fs.stat(filePath);
        return { filePath, mtime: stats.mtimeMs, size: stats.size };
      } catch (_) {
        return null;
      }
    })
  );

  const sorted = fileWithStats
    .filter(Boolean)
    .filter((f) => f.size > 0)
    .sort((a, b) => b.mtime - a.mtime || b.size - a.size);

  return sorted[0]?.filePath || null;
}

const twitterProvider = {
  id: 'twitter',

  match(url) {
    return isTwitterUrl(url);
  },

  async getMetadata(url) {
    try {
      const normalizedUrl = normalizeTwitterUrl(url);
      const info = await ytAdapter.getInfo(normalizedUrl);
      return {
        platform: 'twitter',
        url: normalizedUrl,
        id: info.id,
        title: info.title,
        channel: info.channel,
        durationSeconds: info.durationSeconds,
        thumbnail: info.thumbnail
      };
    } catch (error) {
      throw mapTwitterError(error, 'METADATA_FAILED');
    }
  },

  async download(url, opts) {
    const normalizedUrl = normalizeTwitterUrl(url);
    const outDir = opts.outDir;
    const format = opts.format === 'audio' ? 'audio' : 'video';
    const ext = format === 'audio' ? 'mp3' : 'mp4';
    const baseName = sanitizeFilename(opts.baseName || 'twitter_media');
    const expectedPath = path.join(outDir, `${baseName}.${ext}`);

    try {
      await ytAdapter.download(normalizedUrl, {
        outDir,
        format,
        quality: opts.quality,
        baseName,
        onProgress: opts.onProgress
      });

      const actualPath = await resolveOutputFile(outDir, expectedPath, format);
      if (!actualPath) {
        throw new ProviderError('DOWNLOAD_FAILED', 'Output file not found after download');
      }

      const finalPath = actualPath === expectedPath ? actualPath : expectedPath;
      if (actualPath !== expectedPath) {
        if (await fs.pathExists(expectedPath)) {
          await fs.remove(expectedPath);
        }
        await fs.move(actualPath, expectedPath);
      }

      const stat = await fs.stat(finalPath);
      return {
        filePath: finalPath,
        fileName: path.basename(finalPath),
        bytes: stat.size
      };
    } catch (error) {
      throw mapTwitterError(error, 'DOWNLOAD_FAILED');
    }
  }
};

module.exports = {
  twitterProvider
};
