/**
 * Ultra-fast YouTube HTML-based search service
 * Scrapes YouTube search results directly from HTML (no API)
 * Single request = instant results
 */
const axios = require('axios');

/**
 * Search YouTube using HTML scraping
 * @param {string} query - Search query
 * @returns {Promise<Array<{id: string, title: string, thumbnail: string, duration: string, channel: string}>>}
 */
async function searchYouTube(query) {
  try {
    // Build YouTube search URL
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    // Fetch raw HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 5000 // 5 second timeout
    });
    
    const html = response.data;
    
    // Extract ytInitialData JSON using regex
    // YouTube embeds search results in: var ytInitialData = {...};
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    
    if (!ytInitialDataMatch || !ytInitialDataMatch[1]) {
      console.warn('[SearchService] ytInitialData not found in HTML');
      return [];
    }
    
    // Parse JSON safely
    let ytInitialData;
    try {
      ytInitialData = JSON.parse(ytInitialDataMatch[1]);
    } catch (parseError) {
      console.error('[SearchService] Failed to parse ytInitialData:', parseError.message);
      return [];
    }
    
    // Navigate to videoRenderer items
    // Path: contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents
    const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    // Filter and map only videoRenderer items
    const results = contents
      .filter(item => item.videoRenderer) // Only video results
      .slice(0, 20) // Limit to 20 results
      .map(item => {
        const video = item.videoRenderer;
        
        // Extract video ID
        const videoId = video.videoId;
        if (!videoId) return null;
        
        // Extract title
        const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Unknown';
        
        // Extract thumbnail (use highest quality available)
        let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        if (video.thumbnail?.thumbnails && video.thumbnail.thumbnails.length > 0) {
          // Use the last (highest quality) thumbnail
          const bestThumbnail = video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1];
          thumbnail = bestThumbnail.url || thumbnail;
        }
        
        // Extract duration
        const duration = video.lengthText?.simpleText || video.lengthText?.runs?.[0]?.text || '0:00';
        
        // Extract channel name
        const channel = video.ownerText?.runs?.[0]?.text || video.ownerText?.simpleText || 'Unknown';
        
        return {
          id: videoId,
          title: title,
          thumbnail: thumbnail,
          duration: duration,
          channel: channel
        };
      })
      .filter(item => item !== null); // Remove any null entries
    
    return results;
  } catch (error) {
    console.error('[SearchService] Error:', error.message);
    throw error;
  }
}

module.exports = { searchYouTube };

