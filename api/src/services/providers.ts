const DOMAIN_RULES: Array<{ name: string; regex: RegExp }> = [
  { name: 'youtube', regex: /(?:youtube\.com|youtu\.be)/i },
  { name: 'instagram', regex: /instagram\.com/i },
  { name: 'tiktok', regex: /tiktok\.com/i },
  { name: 'twitter', regex: /(?:twitter\.com|x\.com)/i },
  { name: 'facebook', regex: /facebook\.com/i },
  { name: 'vimeo', regex: /vimeo\.com/i },
  { name: 'dailymotion', regex: /dailymotion\.com/i },
  { name: 'twitch', regex: /twitch\.tv/i },
  { name: 'reddit', regex: /reddit\.com/i },
  { name: 'soundcloud', regex: /soundcloud\.com/i },
  { name: 'mixcloud', regex: /mixcloud\.com/i },
  { name: 'bandcamp', regex: /bandcamp\.com/i },
  { name: 'bilibili', regex: /bilibili\.com/i },
  { name: 'rutube', regex: /rutube\.ru/i },
  { name: 'okru', regex: /ok\.ru/i },
  { name: 'vk', regex: /vk\.com/i },
  { name: 'pinterest', regex: /pinterest\./i },
  { name: 'linkedin', regex: /linkedin\.com/i },
  { name: 'tumblr', regex: /tumblr\.com/i },
  { name: '9gag', regex: /9gag\.com/i },
  { name: 'streamable', regex: /streamable\.com/i },
  { name: 'coub', regex: /coub\.com/i },
  { name: 'archive', regex: /archive\.org/i },
  { name: 'loom', regex: /loom\.com/i }
];

export const SUPPORTED_PROVIDER_IDS: readonly string[] = [
  ...new Set([...DOMAIN_RULES.map((r) => r.name), 'generic'])
];

const BLOCKED_DOMAINS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254'
]);

/** Per-provider capabilities for resolver/preview. Data-driven; add new providers here. */
export const PROVIDER_CAPABILITIES: Record<
  string,
  { supportsPreview: boolean; supportsSelection: boolean; supportsDownload: boolean }
> = {
  youtube: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  vimeo: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  tiktok: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  instagram: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  twitter: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  facebook: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  reddit: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  soundcloud: { supportsPreview: true, supportsSelection: true, supportsDownload: true },
  dailymotion: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  twitch: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  bilibili: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  mixcloud: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  bandcamp: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  streamable: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  coub: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  archive: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  loom: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  rutube: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  okru: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  vk: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  pinterest: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  linkedin: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  tumblr: { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  '9gag': { supportsPreview: true, supportsSelection: false, supportsDownload: true },
  generic: { supportsPreview: true, supportsSelection: false, supportsDownload: true }
};

export function getProviderCapabilities(provider: string): {
  supportsPreview: boolean;
  supportsSelection: boolean;
  supportsDownload: boolean;
} {
  const key = provider.toLowerCase();
  const cap = PROVIDER_CAPABILITIES[key] ?? PROVIDER_CAPABILITIES['generic'];
  return cap ?? { supportsPreview: true, supportsSelection: false, supportsDownload: true };
}

/** Audio-only providers: default format mp3. Video providers default to mp4. */
const AUDIO_PROVIDERS = new Set([
  'soundcloud',
  'mixcloud',
  'bandcamp'
]);

export type ProviderDefaultFormat = 'mp4' | 'mp3';

export function getDefaultFormatForProvider(provider: string): ProviderDefaultFormat {
  return AUDIO_PROVIDERS.has(provider.toLowerCase()) ? 'mp3' : 'mp4';
}

export function detectProvider(url: string): string {
  for (const rule of DOMAIN_RULES) {
    if (rule.regex.test(url)) return rule.name;
  }
  return 'generic';
}

export function isMediaUrlAllowed(rawUrl: string): { ok: boolean; reason?: string } {
  try {
    const u = new URL(rawUrl);
    if (!['http:', 'https:'].includes(u.protocol)) {
      return { ok: false, reason: 'Only HTTP(S) URLs are allowed' };
    }
    if (BLOCKED_DOMAINS.has(u.hostname)) {
      return { ok: false, reason: 'Host is blocked' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
}
