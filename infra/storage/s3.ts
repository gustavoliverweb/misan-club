import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60; // Spec 04 §4.2: 15 minutes

// R2 uses "auto" as pseudo-region and requires an explicit endpoint.
// The AWS SDK is just a library — it works with any S3-compatible provider.
function getS3Client(): S3Client {
  const endpoint = process.env.AWS_ENDPOINT_URL;
  if (!endpoint) throw new Error("AWS_ENDPOINT_URL environment variable is not set");
  return new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

function getBucket(): string {
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!bucket) throw new Error("AWS_BUCKET_NAME environment variable is not set");
  return bucket;
}

export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // R2 encrypts at rest by default — ServerSideEncryption param is not accepted
    }),
  );
}

export async function uploadPdf(key: string, buffer: Buffer): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
      // Private by default — access only via presigned URLs (Spec 03 §3.4 zero-access pattern).
    })
  );
}

export async function getPresignedUrl(key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });
}
