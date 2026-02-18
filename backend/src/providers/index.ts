/**
 * Provider registry.
 * To add a new provider, implement match/getMetadata/download and place it
 * before "generic" in the PROVIDERS array.
 */
import type { Provider } from './types';
import { youtubeProvider } from './youtube';
import { tiktokProvider } from './tiktok';
import { instagramProvider } from './instagram';
import { twitterProvider } from './twitter';
import { facebookProvider } from './facebook';
import { vimeoProvider } from './vimeo';
import { dailymotionProvider } from './dailymotion';
import { twitchProvider } from './twitch';
import { redditProvider } from './reddit';
import { soundcloudProvider } from './soundcloud';
import { mixcloudProvider } from './mixcloud';
import { streamableProvider } from './streamable';
import { bilibiliProvider } from './bilibili';
import { vkProvider } from './vk';
import { bandcampProvider } from './bandcamp';
import { okruProvider } from './okru';
import { rutubeProvider } from './rutube';
import { coubProvider } from './coub';
import { genericProvider } from './generic';

export const PROVIDERS: Provider[] = [
  youtubeProvider,
  tiktokProvider,
  instagramProvider,
  twitterProvider,
  facebookProvider,
  vimeoProvider,
  dailymotionProvider,
  twitchProvider,
  redditProvider,
  soundcloudProvider,
  mixcloudProvider,
  streamableProvider,
  bilibiliProvider,
  vkProvider,
  bandcampProvider,
  okruProvider,
  rutubeProvider,
  coubProvider,
  genericProvider
];

export function getProviderForUrl(url: string): Provider {
  return PROVIDERS.find((provider) => provider.match(url)) || genericProvider;
}
