import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET não configurado");
  }
  return crypto.scryptSync(secret, "salt", 32);
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();
  const encryptedWithTag = encrypted + tag.toString("hex");

  return {
    encrypted: encryptedWithTag,
    iv: iv.toString("hex"),
  };
}

export function decrypt(encryptedWithTag: string, ivHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");

  const tagStart = encryptedWithTag.length - TAG_LENGTH * 2;
  const encrypted = encryptedWithTag.slice(0, tagStart);
  const tag = Buffer.from(encryptedWithTag.slice(tagStart), "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "****";
  }
  const start = apiKey.slice(0, 4);
  const end = apiKey.slice(-4);
  return `${start}****${end}`;
}
