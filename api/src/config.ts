import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    jwksUrl: process.env.SUPABASE_JWKS_URL ?? '',
    jwtIssuer: process.env.SUPABASE_JWT_ISSUER ?? '',
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated'
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
    accessKeyId: process.env.S3_ACCESS_KEY ?? process.env.AWS_ACCESS_KEY_ID ?? 'minio',
    secretAccessKey: process.env.S3_SECRET_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? 'minio123',
    bucket: process.env.S3_BUCKET ?? 'batchtube',
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    skipBucketEnsure: String(process.env.S3_SKIP_BUCKET_ENSURE ?? 'false') === 'true'
  }
};
