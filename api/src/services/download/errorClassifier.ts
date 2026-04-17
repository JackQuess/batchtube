import type { GenericProviderErrorCode, YoutubeErrorClassification, YoutubeErrorCode } from './types.js';

export function classifyYoutubeError(stderr: string): YoutubeErrorClassification {
  const raw = stderr || '';
  const s = raw.toLowerCase();

  if (
    s.includes('private video') ||
    s.includes('this video is private') ||
    s.includes('has been removed') ||
    (s.includes('video unavailable') && (s.includes('private') || s.includes('removed')))
  ) {
    return { code: 'youtube_private', retriable: false, authError: false, clientRetriable: false };
  }

  if (
    s.includes('not available in your country') ||
    (s.includes('region') && s.includes('restrict')) ||
    s.includes('geo-restricted')
  ) {
    return { code: 'youtube_geo_restricted', retriable: false, authError: false, clientRetriable: false };
  }

  if (
    s.includes('sign in to confirm your age') ||
    s.includes('confirm your age') ||
    s.includes('age-restricted')
  ) {
    return { code: 'youtube_cookies_required', retriable: false, authError: true, clientRetriable: false };
  }

  if (
    s.includes('login required') ||
    s.includes('sign in to confirm') ||
    s.includes('http error 403') ||
    s.includes('members-only content')
  ) {
    return { code: 'youtube_login_required', retriable: false, authError: true, clientRetriable: false };
  }

  if (
    s.includes('too many requests') ||
    s.includes('rate limit') ||
    s.includes('http error 429') ||
    s.includes('temporarily blocked')
  ) {
    return { code: 'youtube_rate_limited', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('the page needs to be reloaded') ||
    s.includes('verify you are human') ||
    s.includes('captcha') ||
    s.includes('bot') ||
    s.includes('automation') ||
    raw.includes('Pardon the Interruption')
  ) {
    return { code: 'youtube_antibot', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('requested format is not available') ||
    s.includes('requested format not available') ||
    s.includes('requested format is not') ||
    s.includes('no video formats found')
  ) {
    return { code: 'youtube_extractor_failure', retriable: true, authError: false, clientRetriable: false };
  }

  if (
    s.includes('extractorerror') ||
    s.includes('unable to extract') ||
    s.includes('nsig extraction failed') ||
    s.includes('player_response') ||
    s.includes('signature extraction failed') ||
    s.includes('video unavailable')
  ) {
    return { code: 'youtube_extractor_failure', retriable: true, authError: false, clientRetriable: true };
  }

  if (
    s.includes('http error 5') ||
    s.includes('network') ||
    s.includes('etimedout') ||
    s.includes('econnreset') ||
    s.includes('enotfound') ||
    s.includes('eai_again') ||
    s.includes('timeout')
  ) {
    return { code: 'youtube_transient', retriable: true, authError: false, clientRetriable: false };
  }

  return { code: 'youtube_unknown', retriable: true, authError: false, clientRetriable: false };
}

export function classifyGenericProviderError(stderr: string): { code: GenericProviderErrorCode; retriable: boolean } {
  const raw = stderr || '';
  const s = raw.toLowerCase();

  if (s.includes('http error 429') || s.includes('too many requests') || s.includes('rate limit')) {
    return { code: 'provider_rate_limited', retriable: true };
  }

  if (
    s.includes('[instagram') &&
    (s.includes('unable to download') || s.includes('blocking') || s.includes('challenge'))
  ) {
    return { code: 'provider_rate_limited', retriable: true };
  }

  if (s.includes('http error 401') || s.includes('http error 403') || s.includes('forbidden')) {
    return { code: 'provider_access_denied', retriable: true };
  }

  if (s.includes('[instagram') || s.includes('[tiktok')) {
    if (
      s.includes('login required') ||
      s.includes('log in') ||
      s.includes('sign in') ||
      s.includes('authentication') ||
      s.includes('cookies') ||
      s.includes('session')
    ) {
      return { code: 'provider_access_denied', retriable: true };
    }
  }

  if (s.includes('login required') || s.includes('sign in to') || s.includes('authentication')) {
    return { code: 'provider_auth_required', retriable: false };
  }

  if (s.includes('not available in your country') || (s.includes('geo') && s.includes('restrict'))) {
    return { code: 'provider_geo_restricted', retriable: false };
  }

  if (
    s.includes('video unavailable') ||
    s.includes('not found') ||
    s.includes('private') ||
    s.includes('removed') ||
    s.includes('404')
  ) {
    return { code: 'provider_source_unavailable', retriable: false };
  }
  if (s.includes('unsupported url') || s.includes('unsupported') || s.includes('no suitable extractor')) {
    return { code: 'provider_unsupported', retriable: false };
  }
  if (
    s.includes('extractorerror') ||
    s.includes('unable to extract') ||
    s.includes('failed to parse') ||
    s.includes('signature')
  ) {
    return { code: 'provider_extractor_failure', retriable: true };
  }
  if (
    s.includes('http error 5') ||
    s.includes('timeout') ||
    s.includes('network') ||
    s.includes('etimedout') ||
    s.includes('econnreset') ||
    s.includes('eai_again') ||
    s.includes('enotfound')
  ) {
    return { code: 'provider_transient', retriable: true };
  }

  return { code: 'provider_unknown_failure', retriable: true };
}
