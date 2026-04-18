import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMeter } from './client.js';

// Intercept fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function mockFetchSuccess(ingested = 1) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 202,
    json: async () => ({ success: true, ingested }),
  });
}

function mockFetchFailure(status: number, body = 'error', headers: Record<string, string> = {}) {
  fetchMock.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => body,
    headers: { get: (key: string) => headers[key] ?? null },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Constructor ──────────────────────────────────────────────────────────────

describe('LLMeter constructor', () => {
  it('creates a client with default options', () => {
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    expect(client).toBeDefined();
    void client.shutdown();
  });

  it('warns when no API key is provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    new LLMeter({ flushInterval: 0 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no API key'));
    warnSpy.mockRestore();
  });

  it('suppresses warnings when silent: true', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    new LLMeter({ flushInterval: 0, silent: true });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── track + flush ────────────────────────────────────────────────────────────

describe('track and flush', () => {
  it('buffers events and sends on flush', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    client.track({ model: 'gpt-4o', inputTokens: 100, outputTokens: 50, customerId: 'u1' });

    const result = await client.flush();
    expect(result).toEqual({ success: true, ingested: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://llmeter.org/api/ingest');
    expect(JSON.parse(init.body as string)).toEqual([
      { model: 'gpt-4o', input_tokens: 100, output_tokens: 50, customer_id: 'u1' },
    ]);
  });

  it('sends correct Authorization header', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_abc123', flushInterval: 0 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    await client.flush();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer lm_abc123');
  });

  it('returns null when buffer is empty', async () => {
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const result = await client.flush();
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('batches multiple events in one request', async () => {
    mockFetchSuccess(3);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    client.track({ model: 'gpt-4o-mini', inputTokens: 20, outputTokens: 10, customerId: 'u2' });
    client.track({ model: 'claude-3-5-sonnet-20241022', inputTokens: 30, outputTokens: 15, customerId: 'u3' });

    await client.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body).toHaveLength(3);
  });

  it('includes optional timestamp when provided', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const ts = '2026-04-17T01:15:00.000Z';
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1', timestamp: ts });
    await client.flush();

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body[0].timestamp).toBe(ts);
  });

  it('omits timestamp field when not provided', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    await client.flush();

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect('timestamp' in body[0]).toBe(false);
  });
});

// ── trackAsync ───────────────────────────────────────────────────────────────

describe('trackAsync', () => {
  it('tracks and flushes immediately', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    await client.trackAsync({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── Auto-batch by batchSize ──────────────────────────────────────────────────

describe('auto-flush on batchSize', () => {
  it('auto-flushes when buffer reaches batchSize', async () => {
    mockFetchSuccess(2);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0, batchSize: 2 });

    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    expect(fetchMock).not.toHaveBeenCalled(); // first event: not yet flushed

    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u2' });
    // At batchSize=2, a flush is triggered (async), so we wait a tick
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── Auto-flush by timer ──────────────────────────────────────────────────────

describe('auto-flush timer', () => {
  it('flushes on interval when events are buffered', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 1_000, batchSize: 100 });

    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_001);
    await Promise.resolve(); // flush is async
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    void client.shutdown();
  });
});

// ── Retry logic ──────────────────────────────────────────────────────────────

describe('retry logic', () => {
  it('retries on 429 with Retry-After header', async () => {
    mockFetchFailure(429, 'rate limited', { 'Retry-After': '0' });
    mockFetchSuccess(1);

    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0, maxRetries: 1 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });

    const flushPromise = client.flush();
    await vi.runAllTimersAsync(); // drain timers + microtasks for the retry sleep
    await flushPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on 500 with exponential back-off', async () => {
    mockFetchFailure(500, 'server error');
    mockFetchSuccess(1);

    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0, maxRetries: 1 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });

    const flushPromise = client.flush();
    await vi.runAllTimersAsync(); // drain timers + microtasks for back-off sleep
    await flushPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('logs error and returns null after exhausting retries', async () => {
    mockFetchFailure(500, 'server error');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0, maxRetries: 0 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    const result = await client.flush();

    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ingest failed'));
    errorSpy.mockRestore();
  });

  it('does not retry on 401 (non-retryable)', async () => {
    mockFetchFailure(401, 'Unauthorized');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const client = new LLMeter({ apiKey: 'lm_bad', flushInterval: 0, maxRetries: 3 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    await client.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1); // no retry on 401
    errorSpy.mockRestore();
  });
});

// ── shutdown ─────────────────────────────────────────────────────────────────

describe('shutdown', () => {
  it('flushes remaining events on shutdown', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    await client.shutdown();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('ignores track calls after shutdown', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    await client.shutdown();

    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('closed'));
    warnSpy.mockRestore();
  });
});

// ── Custom base URL ───────────────────────────────────────────────────────────

describe('custom baseUrl', () => {
  it('sends events to the custom URL', async () => {
    mockFetchSuccess(1);
    const client = new LLMeter({
      apiKey: 'lm_test',
      flushInterval: 0,
      baseUrl: 'https://custom.example.com/ingest',
    });
    client.track({ model: 'gpt-4o', inputTokens: 10, outputTokens: 5, customerId: 'u1' });
    await client.flush();

    expect(fetchMock.mock.calls[0][0]).toBe('https://custom.example.com/ingest');
  });
});
