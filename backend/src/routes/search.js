/**
 * Search route handler
 * Ultra-fast YouTube HTML-based search
 */
const express = require('express');
const router = express.Router();
const { searchYouTube } = require('../core/searchService');

/**
 * GET /api/search?q=<query>
 * POST /api/search with body: { query: string }
 */
const handleSearch = async (req, res) => {
  try {
    const query = req.query.q || req.body.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log(`[Search] Query: ${query}`);

    // Handle direct YouTube URL
    if (query.startsWith('http')) {
      const videoIdMatch = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        return res.json([{
          id: videoId,
          title: 'Video',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          duration: '0:00',
          channel: 'Unknown'
        }]);
      }
      return res.json([]);
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
