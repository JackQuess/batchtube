/**
 * Provider registry.
 * To add a new provider, implement match/getMetadata/download and place it
 * before "generic" in the PROVIDERS array.
 */
const { youtubeProvider } = require('./youtube');
const { tiktokProvider } = require('./tiktok');
const { instagramProvider } = require('./instagram');
const { twitterProvider } = require('./twitter');
const { facebookProvider } = require('./facebook');
const { vimeoProvider } = require('./vimeo');
const { dailymotionProvider } = require('./dailymotion');
const { twitchProvider } = require('./twitch');
const { redditProvider } = require('./reddit');
const { soundcloudProvider } = require('./soundcloud');
const { mixcloudProvider } = require('./mixcloud');
const { streamableProvider } = require('./streamable');
const { bilibiliProvider } = require('./bilibili');
const { vkProvider } = require('./vk');
const { bandcampProvider } = require('./bandcamp');
const { okruProvider } = require('./okru');
const { rutubeProvider } = require('./rutube');
const { coubProvider } = require('./coub');
const { archiveProvider } = require('./archive');
const { ninegagProvider } = require('./ninegag');
const { loomProvider } = require('./loom');
const { genericProvider } = require('./generic');

const PROVIDERS = [
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
  archiveProvider,
  ninegagProvider,
  loomProvider,
  genericProvider
];

function getProviderForUrl(url) {
  return PROVIDERS.find((provider) => provider.match(url)) || genericProvider;
}

module.exports = {
  PROVIDERS,
  getProviderForUrl
};
