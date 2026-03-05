import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * Derives a 256-bit key from the ENCRYPTION_KEY environment variable.
 * Uses scrypt for key derivation (resistant to brute-force).
 */
function deriveKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return scryptSync(secret, salt, KEY_LENGTH);
}

export interface EncryptedPayload {
  /** Base64-encoded ciphertext */
  encrypted: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded authentication tag */
  tag: string;
  /** Base64-encoded salt for key derivation */
  salt: string;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Each encryption uses a unique salt + IV for maximum security.
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    salt: salt.toString('base64'),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload back to plaintext.
 * Throws if the tag doesn't match (tampering detected).
 */
export function decrypt(payload: EncryptedPayload): string {
  const salt = Buffer.from(payload.salt, 'base64');
  const key = deriveKey(salt);
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const encrypted = Buffer.from(payload.encrypted, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Convenience: encrypt and return flat strings for DB storage.
 * Maps to providers table columns: api_key_encrypted, api_key_iv, api_key_tag.
 * Salt is prepended to the encrypted field (salt:ciphertext).
 */
export function encryptForDB(plaintext: string): {
  api_key_encrypted: string;
  api_key_iv: string;
  api_key_tag: string;
} {
  const { encrypted, iv, tag, salt } = encrypt(plaintext);
  return {
    api_key_encrypted: `${salt}:${encrypted}`,
    api_key_iv: iv,
    api_key_tag: tag,
  };
}

/**
 * Convenience: decrypt from DB column format.
 */
export function decryptFromDB(row: {
  api_key_encrypted: string;
  api_key_iv: string;
  api_key_tag: string;
}): string {
  const [salt, encrypted] = row.api_key_encrypted.split(':');
  return decrypt({ encrypted, iv: row.api_key_iv, tag: row.api_key_tag, salt });
}
