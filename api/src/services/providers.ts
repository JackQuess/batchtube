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

const BLOCKED_DOMAINS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254'
]);

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
