import { describe, it, expect, vi } from 'vitest';
import { isValidLicenseFormat, normaliseLicenseKey, PLAN_LIMITS } from './plan';
import { validateLicense, LICENSE_VALIDATE_URL } from './license';
import { buildMonthCsv, csvFilename } from './csv';
import { enabledProviders } from './refresh';
import { DEFAULT_STATE, type StoredState } from './types';

describe('license key format', () => {
  it('accepts the issued format, case-insensitively', () => {
    expect(isValidLicenseFormat('LLM-ABCD-EFGH-JKMN-PQRS')).toBe(true);
    expect(isValidLicenseFormat(' llm-abcd-efgh-jkmn-pqrs ')).toBe(true);
    expect(normaliseLicenseKey(' llm-abcd-efgh-jkmn-pqrs ')).toBe('LLM-ABCD-EFGH-JKMN-PQRS');
  });
  it('rejects ambiguous characters and wrong shapes', () => {
    expect(isValidLicenseFormat('LLM-ABCD-EFGH-JKMN-PQR0')).toBe(false); // 0
    expect(isValidLicenseFormat('LLM-ABCD-EFGH-JKMN')).toBe(false);
    expect(isValidLicenseFormat('XXX-ABCD-EFGH-JKMN-PQRS')).toBe(false);
  });
});

describe('validateLicense', () => {
  it('short-circuits on bad format without a network call', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const r = await validateLicense('nope', 'dev', fetchMock);
    expect(r.valid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('posts key + device_id and accepts a valid response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ valid: true, plan: 'pro' }), { status: 200 }),
    );
    const r = await validateLicense('llm-abcd-efgh-jkmn-pqrs', 'dev-1', fetchMock);
    expect(r).toEqual({ valid: true, plan: 'pro' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(LICENSE_VALIDATE_URL);
    expect(JSON.parse(String(init?.body))).toEqual({ key: 'LLM-ABCD-EFGH-JKMN-PQRS', device_id: 'dev-1' });
  });
  it('surfaces server reasons and network failures', async () => {
    const denied = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ valid: false, error: 'License revoked' }), { status: 200 }),
    );
    expect((await validateLicense('LLM-ABCD-EFGH-JKMN-PQRS', 'd', denied)).reason).toBe('License revoked');
    const offline = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'));
    expect((await validateLicense('LLM-ABCD-EFGH-JKMN-PQRS', 'd', offline)).reason).toMatch(/Could not reach/);
  });
});

describe('plan gating', () => {
  const base = (): StoredState => ({ ...DEFAULT_STATE, keys: {}, cache: {}, errors: {}, license: { ...DEFAULT_STATE.license } });

  it('Free allows a single provider, preferring the active one', () => {
    const s = base();
    s.keys = { anthropic: 'a', openai: 'b' };
    s.activeProvider = 'openai';
    expect(enabledProviders(s)).toEqual(['openai']);
  });
  it('Pro allows both', () => {
    const s = base();
    s.keys = { anthropic: 'a', openai: 'b' };
    s.license.plan = 'pro';
    expect(enabledProviders(s)).toEqual(['anthropic', 'openai']);
    expect(PLAN_LIMITS.pro.csvExport).toBe(true);
    expect(PLAN_LIMITS.free.csvExport).toBe(false);
  });
});

describe('CSV export', () => {
  it('emits month-to-date rows with 2 decimals', () => {
    const now = new Date('2026-10-17T12:00:00Z');
    const csv = buildMonthCsv('anthropic', [
      { date: '2026-09-30', usd: 9 },
      { date: '2026-10-01', usd: 1.0149 },
      { date: '2026-10-17', usd: 2 },
    ], now);
    expect(csv).toBe('date,provider,usd\r\n2026-10-01,anthropic,1.01\r\n2026-10-17,anthropic,2.00\r\n');
    expect(csvFilename('openai', now)).toBe('llmeter-openai-2026-10.csv');
  });
});
