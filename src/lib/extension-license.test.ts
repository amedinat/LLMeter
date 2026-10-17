import { describe, it, expect } from 'vitest';
import {
  emailFromCustomData,
  generateLicenseKey,
  hashLicenseKey,
  isExtensionLtdPurchase,
  isValidLicenseKeyFormat,
  licenseLast4,
  LICENSE_ALPHABET,
  normalizeLicenseKey,
  parsePaddleEventBody,
} from './extension-license';

describe('generateLicenseKey', () => {
  it('matches the LLM-XXXX-XXXX-XXXX-XXXX format with the safe alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const key = generateLicenseKey();
      expect(isValidLicenseKeyFormat(key)).toBe(true);
      for (const ch of key.replace(/^LLM-/, '').replace(/-/g, '')) {
        expect(LICENSE_ALPHABET).toContain(ch);
      }
    }
  });

  it('is random (no collisions in a small sample)', () => {
    const keys = new Set(Array.from({ length: 500 }, generateLicenseKey));
    expect(keys.size).toBe(500);
  });
});

describe('normalize / validate / hash', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeLicenseKey('  llm-abcd-efgh-jkmn-pqrs\n')).toBe('LLM-ABCD-EFGH-JKMN-PQRS');
  });
  it('rejects ambiguous characters and malformed keys', () => {
    expect(isValidLicenseKeyFormat('LLM-ABC0-EFGH-JKMN-PQRS')).toBe(false);
    expect(isValidLicenseKeyFormat('LLM-ABCD-EFGH-JKMN')).toBe(false);
    expect(isValidLicenseKeyFormat('')).toBe(false);
  });
  it('hashes case-insensitively and deterministically', () => {
    const a = hashLicenseKey('llm-abcd-efgh-jkmn-pqrs');
    const b = hashLicenseKey('LLM-ABCD-EFGH-JKMN-PQRS');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashLicenseKey('LLM-ABCD-EFGH-JKMN-PQRT')).not.toBe(a);
  });
  it('exposes last4 for support lookups', () => {
    expect(licenseLast4('llm-abcd-efgh-jkmn-pqrs')).toBe('PQRS');
  });
});

describe('Paddle event helpers', () => {
  const body = JSON.stringify({
    event_id: 'evt_1',
    event_type: 'transaction.completed',
    data: {
      id: 'txn_1',
      customer_id: 'ctm_1',
      custom_data: { email: 'Buyer@Example.com' },
      items: [{ price: { id: 'pri_other' } }, { price: { id: 'pri_ext_ltd' } }],
    },
  });

  it('detects an LTD purchase by price id', () => {
    const parsed = parsePaddleEventBody(body);
    expect(isExtensionLtdPurchase(parsed, 'pri_ext_ltd')).toBe(true);
    expect(isExtensionLtdPurchase(parsed, 'pri_nope')).toBe(false);
    expect(isExtensionLtdPurchase(parsed, undefined)).toBe(false);
  });

  it('ignores other event types and bad bodies', () => {
    const other = parsePaddleEventBody(body.replace('transaction.completed', 'transaction.created'));
    expect(isExtensionLtdPurchase(other, 'pri_ext_ltd')).toBe(false);
    expect(parsePaddleEventBody('not json')).toBeNull();
    expect(parsePaddleEventBody('[]')).not.toBeNull();
    expect(isExtensionLtdPurchase(parsePaddleEventBody('"str"'), 'x')).toBe(false);
  });

  it('extracts a lower-cased email from custom_data', () => {
    expect(emailFromCustomData(parsePaddleEventBody(body))).toBe('buyer@example.com');
    expect(emailFromCustomData(parsePaddleEventBody('{"data":{"custom_data":{"email":42}}}'))).toBeNull();
  });
});
