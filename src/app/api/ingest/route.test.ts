import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockThen = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: vi.fn((table: string) => {
      if (table === 'api_keys') {
        return {
          select: mockSelect.mockReturnValue({
            eq: mockEq.mockReturnValue({
              single: mockSingle,
            }),
          }),
          update: mockUpdate.mockReturnValue({
            eq: vi.fn().mockReturnValue({
              then: mockThen.mockImplementation((cb: (r: { error: null }) => void) => {
                cb({ error: null });
              }),
            }),
          }),
        };
      }
      if (table === 'customer_usage_records') {
        return { insert: mockInsert };
      }
      return {};
    }),
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 99, resetAt: Date.now() + 60000 }),
  INGEST_API_LIMIT: { limit: 100, windowMs: 60_000 },
}));

// --- Helpers ---

function makeRequest(body: unknown, apiKey?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey !== undefined) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return new NextRequest('http://localhost/api/ingest', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

function makeRequestNoAuth(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ingest', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  // Default: valid API key
  mockSingle.mockResolvedValue({
    data: { id: 'key-1', user_id: 'user-1', is_active: true },
    error: null,
  });
  mockInsert.mockResolvedValue({ error: null });

  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/ingest', () => {
  // --- Auth ---

  it('returns 401 when Authorization header is missing', async () => {
    const res = await POST(makeRequestNoAuth([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }]));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Missing or invalid API key/);
  });

  it('returns 401 when Authorization header is not Bearer', async () => {
    const req = new NextRequest('http://localhost/api/ingest', {
      method: 'POST',
      body: JSON.stringify([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }]),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic abc123',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when API key is invalid (not found in DB)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }], 'invalid-key'));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Invalid API key/);
  });

  it('returns 403 when API key is disabled', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'key-1', user_id: 'user-1', is_active: false },
      error: null,
    });
    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }], 'disabled-key'));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/disabled/);
  });

  // --- Rate limiting ---

  it('returns 429 when rate limit exceeded', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 30000,
    });

    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }], 'test-key'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
  });

  // --- Validation ---

  it('returns 400 for empty array', async () => {
    const res = await POST(makeRequest([], 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-array body', async () => {
    const res = await POST(makeRequest({ model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }, 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when model is empty string', async () => {
    const res = await POST(makeRequest([{ model: '', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' }], 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when customer_id is missing', async () => {
    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50 }], 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when input_tokens is negative', async () => {
    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: -1, output_tokens: 50, customer_id: 'cust-1' }], 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when output_tokens is not integer', async () => {
    const res = await POST(makeRequest([{ model: 'gpt-4o', input_tokens: 100, output_tokens: 50.5, customer_id: 'cust-1' }], 'test-key'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when timestamp is invalid ISO', async () => {
    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      customer_id: 'cust-1',
      timestamp: 'not-a-date',
    }], 'test-key'));
    expect(res.status).toBe(400);
  });

  // --- Successful ingestion ---

  it('ingests a single event and returns 202', async () => {
    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 500,
      customer_id: 'cust-1',
    }], 'test-key'));

    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.ingested).toBe(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertedRecords = mockInsert.mock.calls[0][0];
    expect(insertedRecords).toHaveLength(1);
    expect(insertedRecords[0]).toMatchObject({
      user_id: 'user-1',
      api_key_id: 'key-1',
      customer_id: 'cust-1',
      model: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 500,
    });
    expect(insertedRecords[0].cost_usd).toBeGreaterThanOrEqual(0);
    expect(insertedRecords[0].timestamp).toBeTruthy();
  });

  it('ingests multiple events in batch', async () => {
    const events = [
      { model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'cust-1' },
      { model: 'gpt-4o', input_tokens: 200, output_tokens: 100, customer_id: 'cust-2' },
      { model: 'gpt-4o', input_tokens: 300, output_tokens: 150, customer_id: 'cust-1' },
    ];

    const res = await POST(makeRequest(events, 'test-key'));
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.ingested).toBe(3);
  });

  it('uses provided timestamp when present', async () => {
    const ts = '2026-04-01T12:00:00Z';
    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      customer_id: 'cust-1',
      timestamp: ts,
    }], 'test-key'));

    expect(res.status).toBe(202);
    const insertedRecords = mockInsert.mock.calls[0][0];
    expect(insertedRecords[0].timestamp).toBe(new Date(ts).toISOString());
  });

  it('assigns provider "unknown" for unrecognized models', async () => {
    const res = await POST(makeRequest([{
      model: 'totally-unknown-model-xyz',
      input_tokens: 100,
      output_tokens: 50,
      customer_id: 'cust-1',
    }], 'test-key'));

    expect(res.status).toBe(202);
    const insertedRecords = mockInsert.mock.calls[0][0];
    expect(insertedRecords[0].provider).toBe('unknown');
  });

  // --- Cost calculation ---

  it('calculates cost correctly for known model', async () => {
    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
      customer_id: 'cust-1',
    }], 'test-key'));

    expect(res.status).toBe(202);
    const insertedRecords = mockInsert.mock.calls[0][0];
    // Cost should be positive for 1M tokens
    expect(insertedRecords[0].cost_usd).toBeGreaterThan(0);
  });

  it('calculates zero cost for zero tokens', async () => {
    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 0,
      output_tokens: 0,
      customer_id: 'cust-1',
    }], 'test-key'));

    expect(res.status).toBe(202);
    const insertedRecords = mockInsert.mock.calls[0][0];
    expect(insertedRecords[0].cost_usd).toBe(0);
  });

  // --- Database failure ---

  it('returns 500 when insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    const res = await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      customer_id: 'cust-1',
    }], 'test-key'));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/Failed to save/);
  });

  // --- API key hash ---

  it('looks up API key by SHA-256 hash, not raw value', async () => {
    await POST(makeRequest([{
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      customer_id: 'cust-1',
    }], 'test-key-123'));

    // The mock chain is: select -> eq -> single
    // Verify eq was called with api_key_hash (not the raw key)
    expect(mockEq).toHaveBeenCalledWith('api_key_hash', expect.any(String));
    // Hash should NOT be the raw key
    const hashArg = mockEq.mock.calls[0][1];
    expect(hashArg).not.toBe('test-key-123');
    expect(hashArg).toHaveLength(64); // SHA-256 hex is 64 chars
  });
});
