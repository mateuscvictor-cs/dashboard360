import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrlBase = process.env.R2_PUBLIC_URL ?? "";

export type PresignContext = "company-file" | "comment" | "resource";

function getClient(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function buildKey(
  context: PresignContext,
  fileName: string,
  companyId?: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const base = `${unique}-${sanitized}`;
  if (context === "company-file" && companyId) {
    return `company-files/${companyId}/${base}`;
  }
  if (context === "resource" && companyId) {
    return `resources/${companyId}/${base}`;
  }
  return `comments/${base}`;
}

export interface PresignResult {
  uploadUrl: string;
  readUrl: string;
  key: string;
}

export async function createPresignedUpload(
  fileName: string,
  contentType: string,
  context: PresignContext,
  companyId?: string
): Promise<PresignResult | null> {
  const client = getClient();
  if (!client || !bucket) {
    return null;
  }
  const key = buildKey(context, fileName, companyId);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const readUrl = publicUrlBase
    ? `${publicUrlBase.replace(/\/$/, "")}/${key}`
    : uploadUrl;
  return { uploadUrl, readUrl, key };
}

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket);
}

export async function getPresignedDownloadUrl(
  key: string,
  fileName: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const client = getClient();
  if (!client || !bucket) return null;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, '\\"')}"`,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getObjectStream(key: string): Promise<ReadableStream<Uint8Array> | null> {
  const client = getClient();
  if (!client || !bucket) return null;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await client.send(command);
  if (!response.Body) return null;
  return response.Body as ReadableStream<Uint8Array>;
}

export async function uploadFromBuffer(
  fileName: string,
  contentType: string,
  buffer: Buffer,
  context: PresignContext,
  companyId?: string
): Promise<PresignResult | null> {
  const client = getClient();
  if (!client || !bucket) {
    return null;
  }
  const key = buildKey(context, fileName, companyId);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Body: buffer,
  });
  await client.send(command);
  const readUrl = publicUrlBase
    ? `${publicUrlBase.replace(/\/$/, "")}/${key}`
    : "";
  return { uploadUrl: "", readUrl, key };
}
