import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';

export const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey
  },
  forcePathStyle: config.s3.forcePathStyle
});

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
  }
}

export async function putObject(params: {
  key: string;
  body: Buffer | string;
  contentType: string;
}) {
  await s3.send(new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType
  }));
}

export async function signedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key
    }),
    { expiresIn }
  );
}
