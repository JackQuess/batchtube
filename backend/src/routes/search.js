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
        return res.json([]);
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
