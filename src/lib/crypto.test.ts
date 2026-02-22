import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, encryptForDB, decryptFromDB } from './crypto';
import type { EncryptedPayload } from './crypto';

beforeAll(() => {
  process.env.ENCRYPTION_SECRET = 'test-secret-key-for-vitest-2026';
});

describe('crypto', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips a simple string', () => {
      const plaintext = 'sk-abc123-my-api-key';
      const payload = encrypt(plaintext);
      const result = decrypt(payload);
      expect(result).toBe(plaintext);
    });

    it('round-trips unicode characters', () => {
      const plaintext = '🔑 clave secreta con ñ y ü';
      const payload = encrypt(plaintext);
      expect(decrypt(payload)).toBe(plaintext);
    });

    it('round-trips empty string', () => {
      const payload = encrypt('');
      expect(decrypt(payload)).toBe('');
    });

    it('round-trips long strings', () => {
      const plaintext = 'a'.repeat(10_000);
      const payload = encrypt(plaintext);
      expect(decrypt(payload)).toBe(plaintext);
    });

    it('generates unique IV and salt per encryption', () => {
      const text = 'same-text';
      const a = encrypt(text);
      const b = encrypt(text);
      expect(a.iv).not.toBe(b.iv);
      expect(a.salt).not.toBe(b.salt);
      expect(a.encrypted).not.toBe(b.encrypted);
    });

    it('returns base64 strings', () => {
      const payload = encrypt('test');
      const b64Regex = /^[A-Za-z0-9+/]+=*$/;
      expect(payload.encrypted).toMatch(b64Regex);
      expect(payload.iv).toMatch(b64Regex);
      expect(payload.tag).toMatch(b64Regex);
      expect(payload.salt).toMatch(b64Regex);
    });

    it('throws on tampered ciphertext', () => {
      const payload = encrypt('sensitive');
      const tampered: EncryptedPayload = {
        ...payload,
        encrypted: Buffer.from('tampered-data').toString('base64'),
      };
      expect(() => decrypt(tampered)).toThrow();
    });

    it('throws on tampered auth tag', () => {
      const payload = encrypt('sensitive');
      const tampered: EncryptedPayload = {
        ...payload,
        tag: Buffer.from('0'.repeat(16)).toString('base64'),
      };
      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('encryptForDB / decryptFromDB', () => {
    it('round-trips through DB format', () => {
      const apiKey = 'sk-ant-api03-abcdefghijk';
      const dbPayload = encryptForDB(apiKey);
      const result = decryptFromDB(dbPayload);
      expect(result).toBe(apiKey);
    });

    it('stores salt:ciphertext in api_key_encrypted', () => {
      const dbPayload = encryptForDB('test-key');
      expect(dbPayload.api_key_encrypted).toContain(':');
      const [salt, cipher] = dbPayload.api_key_encrypted.split(':');
      expect(salt.length).toBeGreaterThan(0);
      expect(cipher.length).toBeGreaterThan(0);
    });

    it('returns all required DB columns', () => {
      const dbPayload = encryptForDB('test-key');
      expect(dbPayload).toHaveProperty('api_key_encrypted');
      expect(dbPayload).toHaveProperty('api_key_iv');
      expect(dbPayload).toHaveProperty('api_key_tag');
    });
  });

  describe('missing ENCRYPTION_SECRET', () => {
    it('throws when secret is not set', () => {
      const original = process.env.ENCRYPTION_SECRET;
      delete process.env.ENCRYPTION_SECRET;
      try {
        expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET');
      } finally {
        process.env.ENCRYPTION_SECRET = original;
      }
    });
  });
});
