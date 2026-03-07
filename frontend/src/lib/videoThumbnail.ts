/**
 * Returns a thumbnail URL for a video URL when possible (e.g. YouTube).
 * Returns null if the provider doesn't support a known thumbnail pattern.
 */
export function getVideoThumbnailUrl(url: string, provider: string): string | null {
  if (!url || !url.trim()) return null;
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();

    if (provider === 'youtube' || host.includes('youtube.com') || host === 'youtu.be') {
      let videoId: string | null = null;
      if (host === 'youtu.be') {
        videoId = u.pathname.slice(1).split('/')[0] || null;
      } else {
        videoId = u.searchParams.get('v') || null;
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }

    if (provider === 'vimeo' || host.includes('vimeo.com')) {
      const m = u.pathname.match(/^\/(?:video\/)?(\d+)/);
      if (m) {
        return `https://vumbnail.com/${m[1]}.jpg`;
      }
    }

    return null;
  } catch {
    return null;
  }
}
