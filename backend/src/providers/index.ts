/**
 * Provider registry.
 * To add a new provider, implement match/getMetadata/download and place it
 * before "generic" in the PROVIDERS array.
 */
import type { Provider } from './types';
import { youtubeProvider } from './youtube';
import { tiktokProvider } from './tiktok';
import { genericProvider } from './generic';

export const PROVIDERS: Provider[] = [youtubeProvider, tiktokProvider, genericProvider];

export function getProviderForUrl(url: string): Provider {
  return PROVIDERS.find((provider) => provider.match(url)) || genericProvider;
}
