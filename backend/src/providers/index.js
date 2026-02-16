/**
 * Provider registry.
 * To add a new provider, implement match/getMetadata/download and place it
 * before "generic" in the PROVIDERS array.
 */
const { youtubeProvider } = require('./youtube');
const { tiktokProvider } = require('./tiktok');
const { instagramProvider } = require('./instagram');
const { twitterProvider } = require('./twitter');
const { genericProvider } = require('./generic');

const PROVIDERS = [
  youtubeProvider,
  tiktokProvider,
  instagramProvider,
  twitterProvider,
  genericProvider
];

function getProviderForUrl(url) {
  return PROVIDERS.find((provider) => provider.match(url)) || genericProvider;
}

module.exports = {
  PROVIDERS,
  getProviderForUrl
};
