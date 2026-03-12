import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  cors: {
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? 'https://batchtube.net',
    allowedOrigin2: process.env.ALLOWED_ORIGIN_2 ?? 'https://www.batchtube.net',
    /** Comma-separated list, or use ALLOWED_ORIGIN + ALLOWED_ORIGIN_2. Production API must include frontend origin (e.g. https://batchtube.net). */
    get allowedOrigins(): string[] {
      const fromEnv = process.env.CORS_ALLOWED_ORIGINS
        ?.split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (fromEnv?.length) return fromEnv;
      const list = [
        this.allowedOrigin,
        this.allowedOrigin2,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ].filter((o): o is string => Boolean(o?.trim()));
      return [...new Set(list)];
    }
  },
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    jwksUrl: process.env.SUPABASE_JWKS_URL ?? '',
    jwtIssuer: process.env.SUPABASE_JWT_ISSUER ?? '',
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated'
  },
  lemonsqueezy: {
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '',
    variantPro: process.env.LEMONSQUEEZY_VARIANT_PRO ?? '',
    variantUltra: process.env.LEMONSQUEEZY_VARIANT_ULTRA ?? ''
  },
  paddle: {
    apiBase: process.env.PADDLE_API_BASE ?? 'https://api.paddle.com',
    apiKey: process.env.PADDLE_API_KEY ?? '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? '',
    priceIdPro: process.env.PADDLE_PRICE_ID_PRO ?? '',
    priceIdArchivist: process.env.PADDLE_PRICE_ID_ARCHIVIST ?? '',
    priceIdEnterprise: process.env.PADDLE_PRICE_ID_ENTERPRISE ?? '',
    successUrl: process.env.PADDLE_SUCCESS_URL ?? '',
    cancelUrl: process.env.PADDLE_CANCEL_URL ?? ''
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKeyId:
      process.env.S3_ACCESS_KEY ?? process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? 'minio',
    secretAccessKey:
      process.env.S3_SECRET_KEY ?? process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? 'minio123',
    bucket: process.env.S3_BUCKET ?? 'batchtube',
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    skipBucketEnsure: String(process.env.S3_SKIP_BUCKET_ENSURE ?? 'false') === 'true'
  },
  /** Optional: path to cookies.txt for yt-dlp (age-restricted / login-required content). */
  ytDlpCookiesPath: process.env.YT_DLP_COOKIES_FILE ?? '',
  /** Optional: import cookies directly from browser profile on worker host (e.g. chrome, firefox). */
  ytDlpCookiesFromBrowser: process.env.YT_DLP_COOKIES_FROM_BROWSER ?? '',
  /** Optional: browser profile passed to --cookies-from-browser (e.g. Default). */
  ytDlpCookiesFromBrowserProfile: process.env.YT_DLP_COOKIES_FROM_BROWSER_PROFILE ?? '',
  /** yt-dlp command hard timeout in milliseconds (per attempt). */
  ytDlpTimeoutMs: Number(process.env.YT_DLP_TIMEOUT_MS ?? 300000),
  /** yt-dlp socket timeout in seconds. */
  ytDlpSocketTimeoutSec: Number(process.env.YT_DLP_SOCKET_TIMEOUT_SEC ?? 20),
  /** Fast-mode yt-dlp retries (first attempt path). */
  ytDlpRetriesFast: Number(process.env.YT_DLP_RETRIES_FAST ?? 1),
  /** Safe-mode yt-dlp retries (fallback path). */
  ytDlpRetriesSafe: Number(process.env.YT_DLP_RETRIES_SAFE ?? 3),
  /** Fast-mode fragment retries. */
  ytDlpFragmentRetriesFast: Number(process.env.YT_DLP_FRAGMENT_RETRIES_FAST ?? 1),
  /** Safe-mode fragment retries. */
  ytDlpFragmentRetriesSafe: Number(process.env.YT_DLP_FRAGMENT_RETRIES_SAFE ?? 3),
  /** Fast-mode extractor retries. */
  ytDlpExtractorRetriesFast: Number(process.env.YT_DLP_EXTRACTOR_RETRIES_FAST ?? 1),
  /** Safe-mode extractor retries. */
  ytDlpExtractorRetriesSafe: Number(process.env.YT_DLP_EXTRACTOR_RETRIES_SAFE ?? 3),
  /** Maximum YouTube attempts across all fallback modes. */
  ytDlpYoutubeMaxAttempts: Number(process.env.YT_DLP_YOUTUBE_MAX_ATTEMPTS ?? 10),
  /** Exponential backoff base for YouTube fallback attempts. */
  ytDlpYoutubeBackoffBaseMs: Number(process.env.YT_DLP_YOUTUBE_BACKOFF_BASE_MS ?? 1000),
  /** Minimum recommended yt-dlp version date (YYYY.MM.DD). */
  ytDlpMinVersionDate: process.env.YT_DLP_MIN_VERSION_DATE ?? '2025.01.01',
  /** Optional: comma-separated user UUIDs that are admins (API key + Studio bypass plan restrictions). */
  get adminUserIds(): string[] {
    return (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  },
  /**
   * Legacy global worker concurrency (default 20). Used as a base for provider-level limits and
   * as default for download/processing worker roles when dedicated env vars are not set.
   */
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? 20),
  /** Download worker concurrency (default: WORKER_CONCURRENCY). */
  workerDownloadConcurrency: Number(
    process.env.WORKER_CONCURRENCY_DOWNLOAD ?? process.env.WORKER_CONCURRENCY ?? 20
  ),
  /** Processing worker concurrency (default: WORKER_CONCURRENCY, typically lower). */
  workerProcessingConcurrency: Number(
    process.env.WORKER_CONCURRENCY_PROCESSING ?? process.env.WORKER_CONCURRENCY ?? 10
  ),
  /**
   * Optional per-provider concurrency caps. Example: WORKER_CONCURRENCY_YOUTUBE=5, WORKER_CONCURRENCY_VIMEO=15.
   * Effective concurrency for a provider is min(workerConcurrency, providerCap).
   * Keys are lowercased (youtube, vimeo, instagram, tiktok, etc.).
   */
  get workerConcurrencyByProvider(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(process.env)) {
      const m = key.match(/^WORKER_CONCURRENCY_(.+)$/);
      if (m) {
        const provider = (m[1] as string).toLowerCase();
        const n = Number(value);
        if (Number.isInteger(n) && n >= 1) out[provider] = n;
      }
    }
    return out;
  }
};
