export type ProviderCategory = 'video' | 'social' | 'audio' | 'other' | 'direct';
export type ProviderTier = 'free' | 'pro';

export interface ProviderEntry {
  id: string;
  name: string;
  category: ProviderCategory;
  tier: ProviderTier;
}

export const PROVIDER_CATALOG: ProviderEntry[] = [
  { id: 'youtube', name: 'YouTube', category: 'video', tier: 'free' },
  { id: 'vimeo', name: 'Vimeo', category: 'video', tier: 'pro' },
  { id: 'dailymotion', name: 'Dailymotion', category: 'video', tier: 'pro' },
  { id: 'twitch', name: 'Twitch', category: 'video', tier: 'pro' },
  { id: 'bilibili', name: 'Bilibili', category: 'video', tier: 'pro' },
  { id: 'rutube', name: 'RuTube', category: 'video', tier: 'pro' },
  { id: 'okru', name: 'OK.ru', category: 'video', tier: 'pro' },

  { id: 'tiktok', name: 'TikTok', category: 'social', tier: 'free' },
  { id: 'instagram', name: 'Instagram', category: 'social', tier: 'free' },
  { id: 'twitter', name: 'X / Twitter', category: 'social', tier: 'pro' },
  { id: 'facebook', name: 'Facebook', category: 'social', tier: 'pro' },
  { id: 'reddit', name: 'Reddit', category: 'social', tier: 'pro' },
  { id: 'tumblr', name: 'Tumblr', category: 'social', tier: 'pro' },
  { id: 'pinterest', name: 'Pinterest', category: 'social', tier: 'pro' },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', tier: 'pro' },
  { id: 'vk', name: 'VK', category: 'social', tier: 'pro' },
  { id: '9gag', name: '9GAG', category: 'social', tier: 'pro' },

  { id: 'soundcloud', name: 'SoundCloud', category: 'audio', tier: 'pro' },
  { id: 'mixcloud', name: 'Mixcloud', category: 'audio', tier: 'pro' },
  { id: 'bandcamp', name: 'Bandcamp', category: 'audio', tier: 'pro' },

  { id: 'streamable', name: 'Streamable', category: 'other', tier: 'pro' },
  { id: 'coub', name: 'Coub', category: 'other', tier: 'pro' },
  { id: 'archive', name: 'Archive.org', category: 'other', tier: 'pro' },
  { id: 'loom', name: 'Loom', category: 'other', tier: 'pro' },

  { id: 'generic', name: 'Direct link', category: 'direct', tier: 'free' },
  { id: 'm3u8', name: 'M3U8 stream', category: 'direct', tier: 'pro' }
];

export const FREE_PROVIDER_IDS = new Set(PROVIDER_CATALOG.filter((p) => p.tier === 'free').map((p) => p.id));
