/**
 * Search route handler
 * Ultra-fast YouTube HTML-based search
 */
const express = require('express');
const router = express.Router();
const { searchYouTube } = require('../core/searchService');
const { getProviderForUrl } = require('../providers');

function isLikelyUrl(value) {
  if (typeof value !== 'string') return false;
  return /^https?:\/\//i.test(value.trim());
}

function normalizeQueryInput(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.replace(/^['"`]+|['"`]+$/g, '').trim();
}

function formatDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds)) return '0:00';
  const total = Math.max(0, Math.round(durationSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getFallbackTitle(providerId, url) {
  if (providerId === 'twitter') return 'Twitter/X post';
  if (providerId === 'instagram') return 'Instagram media';
  if (providerId === 'tiktok') return 'TikTok video';
  if (providerId === 'youtube') return 'YouTube video';
  if (providerId === 'facebook') return 'Facebook video';
  if (providerId === 'vimeo') return 'Vimeo video';
  if (providerId === 'dailymotion') return 'Dailymotion video';
  if (providerId === 'twitch') return 'Twitch clip/VOD';
  if (providerId === 'reddit') return 'Reddit video';
  if (providerId === 'soundcloud') return 'SoundCloud track';
  if (providerId === 'mixcloud') return 'Mixcloud show';
  if (providerId === 'streamable') return 'Streamable video';
  if (providerId === 'bilibili') return 'Bilibili video';
  if (providerId === 'vk') return 'VK video';
  if (providerId === 'bandcamp') return 'Bandcamp track';
  if (providerId === 'okru') return 'OK.ru video';
  if (providerId === 'rutube') return 'RuTube video';
  if (providerId === 'coub') return 'Coub video';
  if (providerId === 'archive') return 'Archive.org media';
  if (providerId === '9gag') return '9GAG video';
  if (providerId === 'loom') return 'Loom recording';
  if (providerId === 'linkedin') return 'LinkedIn video';
  if (providerId === 'pinterest') return 'Pinterest video';
  if (providerId === 'tumblr') return 'Tumblr media';

  try {
    const parsed = new URL(url);
    const name = decodeURIComponent((parsed.pathname || '').split('/').filter(Boolean).pop() || '');
    return name || 'Direct media';
  } catch (_) {
    return 'Direct media';
  }
}

function getFallbackChannel(providerId) {
  if (providerId === 'twitter') return 'X/Twitter';
  if (providerId === 'instagram') return 'Instagram';
  if (providerId === 'tiktok') return 'TikTok';
  if (providerId === 'youtube') return 'YouTube';
  if (providerId === 'facebook') return 'Facebook';
  if (providerId === 'vimeo') return 'Vimeo';
  if (providerId === 'dailymotion') return 'Dailymotion';
  if (providerId === 'twitch') return 'Twitch';
  if (providerId === 'reddit') return 'Reddit';
  if (providerId === 'soundcloud') return 'SoundCloud';
  if (providerId === 'mixcloud') return 'Mixcloud';
  if (providerId === 'streamable') return 'Streamable';
  if (providerId === 'bilibili') return 'Bilibili';
  if (providerId === 'vk') return 'VK';
  if (providerId === 'bandcamp') return 'Bandcamp';
  if (providerId === 'okru') return 'OK.ru';
  if (providerId === 'rutube') return 'RuTube';
  if (providerId === 'coub') return 'Coub';
  if (providerId === 'archive') return 'Archive.org';
  if (providerId === '9gag') return '9GAG';
  if (providerId === 'loom') return 'Loom';
  if (providerId === 'linkedin') return 'LinkedIn';
  if (providerId === 'pinterest') return 'Pinterest';
  if (providerId === 'tumblr') return 'Tumblr';
  return 'Direct link';
}

/**
 * GET /api/search?q=<query>
 * POST /api/search with body: { query: string }
 */
const handleSearch = async (req, res) => {
  try {
    const query = normalizeQueryInput(req.query.q || req.body.query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log(`[Search] Query: ${query}`);

    // Handle direct URL through provider metadata
    if (isLikelyUrl(query)) {
      const provider = getProviderForUrl(query);
      try {
        const meta = await provider.getMetadata(query);
        return res.json([{
          id: meta.id || query,
          title: meta.title || 'Video',
          thumbnail: meta.thumbnail || null,
          duration: formatDuration(meta.durationSeconds),
          channel: meta.channel || 'Unknown',
          platform: meta.platform,
          url: meta.url || query
        }]);
      } catch (error) {
        console.warn('[Search] URL metadata failed:', error.message || error);
        return res.json([{
          id: query,
          title: getFallbackTitle(provider.id, query),
          thumbnail: null,
          duration: '0:00',
          channel: getFallbackChannel(provider.id),
          platform: provider.id,
          url: query
        }]);
      }
    }

    // Perform HTML-based search
    const results = await searchYouTube(query.trim());

    console.log(`[Search] Found ${results.length} results`);
    
    // Return results array directly (frontend expects array)
    res.json(results);
  } catch (error) {
    console.error('[Search] Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

module.exports = { handleSearch };
