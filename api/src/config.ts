import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  admin: {
    email: process.env.ADMIN_EMAIL ?? '',
    passwordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
    jwtSecret: process.env.ADMIN_JWT_SECRET ?? ''
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'minio',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'minio123',
    bucket: process.env.S3_BUCKET ?? 'batchtube',
    forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true'
  }
};
