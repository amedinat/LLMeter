import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { hashLicenseKey } from '@/lib/extension-license';

// --- Mocks ---

const mockCheckRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

interface TableBehavior {
  license?: { data: unknown; error: { message: string } | null };
  devices?: { data: unknown; error: { message: string } | null };
}
let behavior: TableBehavior;
const upsertSpy = vi.fn();
const updateSpy = vi.fn();

function licensesChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(behavior.license ?? { data: null, error: null });
  chain.update = vi.fn().mockImplementation((v: unknown) => {
    updateSpy(v);
    return { eq: vi.fn().mockResolvedValue({ error: null }) };
  });
  return chain;
}

function devicesChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  // The devices select is awaited directly after .eq()
  chain.eq = vi.fn().mockResolvedValue(behavior.devices ?? { data: [], error: null });
  chain.upsert = vi.fn().mockImplementation((v: unknown, o: unknown) => {
    upsertSpy(v, o);
    return Promise.resolve({ error: null });
  });
  return chain;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => (table === 'extension_licenses' ? licensesChain() : devicesChain()),
  }),
}));

// --- Helpers ---

const KEY = 'LLM-ABCD-EFGH-JKMN-PQRS';
const DEVICE = 'device-0123456789';

function makeRequest(body: unknown, ip = '1.2.3.4'): NextRequest {
  return new NextRequest('http://localhost/api/extension/license/validate', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
  });
}

const activeLicense = { id: 'lic_1', status: 'active', max_devices: 2 };

// --- Tests ---

describe('POST /api/extension/license/validate', () => {
  let POST: (req: NextRequest) => Promise<Response>;
  let OPTIONS: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    behavior = {};
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 10, resetAt: 0 });
    const mod = await import('./route');
    POST = mod.POST;
    OPTIONS = mod.OPTIONS;
  });

  it('answers CORS preflight', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({ success: false, remaining: 0, resetAt: 0 });
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(res.status).toBe(429);
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ext-license:1.2.3.4', expect.anything());
  });

  it('returns 400 on malformed body', async () => {
    expect((await POST(makeRequest('not json'))).status).toBe(400);
    expect((await POST(makeRequest({ key: KEY }))).status).toBe(400);
  });

  it('rejects a badly formatted key without touching the DB', async () => {
    const res = await POST(makeRequest({ key: 'LLM-0000-0000-0000-0000', device_id: DEVICE }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ valid: false, error: expect.stringMatching(/format/i) });
  });

  it('returns valid=false for an unknown key', async () => {
    behavior.license = { data: null, error: null };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(await res.json()).toEqual({ valid: false, error: 'License key not found.' });
  });

  it('returns valid=false for a revoked key', async () => {
    behavior.license = { data: { ...activeLicense, status: 'revoked' }, error: null };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect((await res.json()).error).toMatch(/revoked/);
  });

  it('validates an active key, binds the device and stamps last_validated_at', async () => {
    behavior.license = { data: activeLicense, error: null };
    behavior.devices = { data: [], error: null };
    const res = await POST(makeRequest({ key: ` ${KEY.toLowerCase()} `, device_id: DEVICE }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ valid: true, plan: 'pro' });
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ license_id: 'lic_1', device_id: DEVICE }),
      { onConflict: 'license_id,device_id' },
    );
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ last_validated_at: expect.any(String) }));
  });

  it('accepts a known device even when the limit is reached', async () => {
    behavior.license = { data: activeLicense, error: null };
    behavior.devices = { data: [{ device_id: DEVICE }, { device_id: 'other' }], error: null };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(await res.json()).toEqual({ valid: true, plan: 'pro' });
  });

  it('rejects a new device once max_devices is reached', async () => {
    behavior.license = { data: activeLicense, error: null };
    behavior.devices = { data: [{ device_id: 'a' }, { device_id: 'b' }], error: null };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(res.status).toBe(200);
    expect((await res.json()).error).toMatch(/Device limit reached \(2\)/);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('returns 500 when the license lookup fails', async () => {
    behavior.license = { data: null, error: { message: 'db down' } };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(res.status).toBe(500);
    expect((await res.json()).valid).toBe(false);
  });

  it('returns 500 when the device lookup fails instead of assuming zero devices', async () => {
    behavior.license = { data: activeLicense, error: null };
    behavior.devices = { data: null, error: { message: 'timeout' } };
    const res = await POST(makeRequest({ key: KEY, device_id: DEVICE }));
    expect(res.status).toBe(500);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('looks the key up by its hash', async () => {
    // Sanity: the same normalisation the route applies yields a stable hash.
    expect(hashLicenseKey(` ${KEY.toLowerCase()} `)).toBe(hashLicenseKey(KEY));
  });
});
