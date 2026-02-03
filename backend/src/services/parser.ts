
import fetch from 'node-fetch';
import { VideoResult } from '../types.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

export const searchYouTube = async (query: string): Promise<VideoResult[]> => {
  // Check if query is a URL
  const isUrl = query.startsWith('http');
  
  if (isUrl) {
    return resolveUrl(query);
  } else {
    return scrapeSearchResults(query);
  }
};

const resolveUrl = async (url: string): Promise<VideoResult[]> => {
  try {
    // Basic ID extraction
    let videoId = '';
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
      videoId = match[7];
    }

    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) throw new Error('Failed to resolve URL');
    
    const data: any = await response.json();
    
    return [{
      id: videoId,
      title: data.title,
      thumbnail: data.thumbnail_url,
      channel: data.author_name,
      duration: 'Unknown', // oEmbed doesn't provide duration
      views: 'N/A',
      description: 'Direct link result'
    }];
  } catch (error) {
    console.error('oEmbed failed', error);
    return [];
  }
};

const scrapeSearchResults = async (query: string): Promise<VideoResult[]> => {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US' }
    });
    
    const html = await response.text();
    
    // Extract ytInitialData
    const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
    if (!jsonMatch) return [];
    
    const data = JSON.parse(jsonMatch[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents
      ?.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer?.contents;

    if (!contents) return [];

    const results: VideoResult[] = [];

    for (const item of contents) {
      if (item.videoRenderer) {
        const v = item.videoRenderer;
        
        // Extract Title
        const title = v.title?.runs?.[0]?.text || v.title?.accessibility?.accessibilityData?.label || 'No Title';
        
        // Extract Thumbnail (Get largest available)
        const thumbnails = v.thumbnail?.thumbnails || [];
        const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

        // Extract Channel Info
        const channelName = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown';
        const channelId = v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || 
                          v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
        const channelAvatar = v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url;

        // Extract Description
        const descRuns = v.detailedMetadataSnippets?.[0]?.snippetText?.runs || 
                         v.descriptionSnippet?.runs;
        const description = descRuns ? descRuns.map((r: any) => r.text).join('') : '';

        results.push({
          id: v.videoId,
          title,
          thumbnail,
          duration: v.lengthText?.simpleText || 'Live',
          channel: channelName,
          channelId,
          channelAvatar,
          views: v.viewCountText?.simpleText || '0 views',
          publishedTime: v.publishedTimeText?.simpleText || '',
          description
        });
      }
      if (results.length >= 20) break;
    }

    return results;
  } catch (error) {
    console.error('Scraping failed', error);
    return [];
  }
};
