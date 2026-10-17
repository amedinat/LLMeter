import { describe, it, expect, vi } from 'vitest';
import anthropicFixture from '../../test/fixtures/anthropic-cost-report.json';
import openaiFixture from '../../test/fixtures/openai-costs.json';
import {
  buildAnthropicCostUrl,
  fetchAnthropicDailyCosts,
  looksLikeAnthropicAdminKey,
  parseAnthropicCostReport,
  type AnthropicCostReport,
} from './anthropic';
import {
  buildOpenAICostsUrl,
  fetchOpenAIDailyCosts,
  parseOpenAICostsPage,
  type OpenAICostsPage,
} from './openai';
import { ProviderError } from '../errors';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const START = new Date('2026-10-01T00:00:00Z');
const END = new Date('2026-10-18T00:00:00Z');

describe('Anthropic cost report', () => {
  it('parses buckets into daily USD (cents → dollars)', () => {
    const days = parseAnthropicCostReport(anthropicFixture as AnthropicCostReport);
    expect(days).toEqual([
      { date: '2026-10-01', usd: 20 }, // (1234.5 + 765.5) cents
      { date: '2026-10-02', usd: 0 },
      { date: '2026-10-03', usd: 5 },
    ]);
  });

  it('builds the documented request', () => {
    const url = new URL(buildAnthropicCostUrl(START, END, 'page_x'));
    expect(url.origin + url.pathname).toBe('https://api.anthropic.com/v1/organizations/cost_report');
    expect(url.searchParams.get('starting_at')).toBe('2026-10-01T00:00:00.000Z');
    expect(url.searchParams.get('bucket_width')).toBe('1d');
    expect(url.searchParams.get('limit')).toBe('31');
    expect(url.searchParams.get('page')).toBe('page_x');
  });

  it('sends admin headers and follows pagination', async () => {
    const page1: AnthropicCostReport = {
      data: [{ starting_at: '2026-10-01T00:00:00Z', ending_at: '2026-10-02T00:00:00Z', results: [{ amount: '100' }] }],
      has_more: true,
      next_page: 'p2',
    };
    const page2: AnthropicCostReport = {
      data: [{ starting_at: '2026-10-02T00:00:00Z', ending_at: '2026-10-03T00:00:00Z', results: [{ amount: '200' }] }],
      has_more: false,
    };
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));

    const days = await fetchAnthropicDailyCosts('sk-ant-admin01-test', START, END, fetchMock);
    expect(days).toEqual([
      { date: '2026-10-01', usd: 1 },
      { date: '2026-10-02', usd: 2 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-admin01-test');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(String(fetchMock.mock.calls[1]![0])).toContain('page=p2');
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [429, 'rate_limited'],
    [500, 'http'],
  ] as const)('maps HTTP %i to a readable error', async (status, code) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: 'x' }, status));
    const err = await fetchAnthropicDailyCosts('k', START, END, fetchMock).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect((err as ProviderError).code).toBe(code);
    expect((err as ProviderError).message).toContain('Anthropic');
  });

  it('rejects non-JSON bodies', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(fetchAnthropicDailyCosts('k', START, END, fetchMock)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('recognises admin keys', () => {
    expect(looksLikeAnthropicAdminKey('sk-ant-admin01-abc')).toBe(true);
    expect(looksLikeAnthropicAdminKey('sk-ant-api03-abc')).toBe(false);
  });
});

describe('OpenAI costs', () => {
  it('parses buckets into daily USD and ignores null amounts', () => {
    const days = parseOpenAICostsPage(openaiFixture as OpenAICostsPage);
    expect(days).toEqual([
      { date: '2025-10-01', usd: 20 },
      { date: '2025-10-02', usd: 0 },
    ]);
  });

  it('builds the documented request with unix seconds', () => {
    const url = new URL(buildOpenAICostsUrl(START, END));
    expect(url.origin + url.pathname).toBe('https://api.openai.com/v1/organization/costs');
    expect(url.searchParams.get('start_time')).toBe(String(START.getTime() / 1000));
    expect(url.searchParams.get('end_time')).toBe(String(END.getTime() / 1000));
    expect(url.searchParams.get('bucket_width')).toBe('1d');
    expect(url.searchParams.get('limit')).toBe('180');
  });

  it('uses a bearer token and maps 403 to a permissions message', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 403));
    const err = await fetchOpenAIDailyCosts('sk-admin-x', START, END, fetchMock).catch((e: unknown) => e as ProviderError);
    expect(err).toMatchObject({ code: 'forbidden' });
    const headers = fetchMock.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-admin-x');
  });

  it('wraps network failures', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchOpenAIDailyCosts('k', START, END, fetchMock)).rejects.toMatchObject({ code: 'network' });
  });
});
