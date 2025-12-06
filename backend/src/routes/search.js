import fetch from 'node-fetch';

export const handleSearch = async (req, res) => {
  try {
    const query = req.query.q || req.body.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log(`[Search] Query: ${query}`);

    // Check if it's a URL
    if (query.startsWith('http')) {
      const videoIdMatch = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        return res.json([{
          id: videoId,
          title: 'Video',
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: '0:00',
          channel: 'Unknown'
        }]);
      }
      return res.json([]);
    }

    // HTML-based search
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();

    // Extract ytInitialData
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (!ytInitialDataMatch) {
      return res.json([]);
    }

    const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
    const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const results = contents
      .filter(item => item.videoRenderer)
      .slice(0, 20)
      .map(item => {
        const video = item.videoRenderer;
        return {
          id: video.videoId,
          title: video.title?.runs?.[0]?.text || 'Unknown',
          thumbnail: video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
          duration: video.lengthText?.simpleText || '0:00',
          channel: video.ownerText?.runs?.[0]?.text || 'Unknown'
        };
      });

    console.log(`[Search] Found ${results.length} results`);
    res.json(results);
  } catch (error) {
    console.error('[Search] Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};
