import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiAdapter } from './openai-adapter';
import { anthropicAdapter } from './anthropic-adapter';
import { googleAdapter } from './google-adapter';
import { deepseekAdapter } from './deepseek-adapter';
import { mistralAdapter } from './mistral-adapter';
import { azureAdapter, parseAzureCredentials } from './azure-adapter';
import { xaiAdapter } from './xai-adapter';
import { cohereAdapter } from './cohere-adapter';
import { groqAdapter } from './groq-adapter';
import { togetherAdapter } from './together-adapter';
import { fireworksAdapter } from './fireworks-adapter';
import { perplexityAdapter } from './perplexity-adapter';
import { cerebrasAdapter } from './cerebras-adapter';
import { ai21Adapter } from './ai21-adapter';
import { deepinfraAdapter } from './deepinfra-adapter';
import { novitaAdapter } from './novita-adapter';
import { hyperbolicAdapter } from './hyperbolic-adapter';
import { sambanovaAdapter } from './sambanova-adapter';
import { lambdalabsAdapter } from './lambdalabs-adapter';
import { leptonAdapter } from './lepton-adapter';
import { inferencenetAdapter } from './inferencenet-adapter';
import { nvidiaAdapter } from './nvidia-adapter';
import { cloudflareAdapter, parseCloudflareCredentials } from './cloudflare-adapter';
import { nebiusAdapter } from './nebius-adapter';
import { replicateAdapter } from './replicate-adapter';
import { featherlessAdapter } from './featherless-adapter';
import { huggingfaceAdapter } from './huggingface-adapter';
import { yiAdapter } from './yi-adapter';
import { zhipuAdapter } from './zhipu-adapter';
import { upstageAdapter } from './upstage-adapter';
import { moonshotAdapter } from './moonshot-adapter';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Provider Adapters', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  describe('OpenAI Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await openaiAdapter.validateKey('sk-test');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-test' },
        })
      );
    });

    it('validateKey throws on error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid key' } }),
      });

      await expect(openaiAdapter.validateKey('bad-key')).rejects.toThrow('Invalid key');
    });

    it('fetchUsage parses OpenAI response correctly', async () => {
      const mockResponse = {
        data: [
          {
            start_time: 1704067200, // 2024-01-01
            results: [
              {
                model: 'gpt-4o',
                input_tokens: 1000,
                output_tokens: 500,
                num_model_requests: 10,
              },
            ],
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      const records = await openaiAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-01',
          model: 'gpt-4o',
          inputTokens: 1000,
          outputTokens: 500,
          requests: 10,
        })
      );
      // Cost calculation check (approximate)
      expect(records[0].costUsd).toBeGreaterThan(0);
    });
  });

  describe('Anthropic Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await anthropicAdapter.validateKey('sk-ant-test');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages/count_tokens',
        expect.any(Object)
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(anthropicAdapter.validateKey('bad-key')).rejects.toThrow('Invalid API key');
    });

    it('fetchUsage parses Anthropic Admin API response correctly', async () => {
      // Mock matches actual Anthropic Admin API response structure
      const mockUsageResponse = {
        data: [
          {
            starting_at: '2024-01-01T00:00:00Z',
            results: [
              {
                model: 'claude-3-opus-20240229',
                uncached_input_tokens: 800,
                cache_read_input_tokens: 200,
                output_tokens: 500,
                num_requests: 5,
              },
            ],
          },
        ],
        has_more: false,
      };

      const mockCostResponse = {
        data: [
          {
            starting_at: '2024-01-01T00:00:00Z',
            results: [
              {
                description: 'claude-3-opus-20240229',
                amount: '2.325',
              },
            ],
          },
        ],
        has_more: false,
      };

      // fetchUsage calls usage API then cost API in parallel
      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => mockUsageResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockCostResponse });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      const records = await anthropicAdapter.fetchUsage('sk-ant-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-01',
          model: 'claude-3-opus-20240229',
          inputTokens: 1000, // 800 uncached + 200 cache_read
          outputTokens: 500,
          requests: 5,
        })
      );
      // Should use actual cost from Cost API (2.325 cents = $0.02325)
      expect(records[0].costUsd).toBeCloseTo(0.02325, 4);
    });

    it('fetchUsage fills in request counts from Cost API when Usage API returns 0', async () => {
      // Usage API returns num_requests: 0 (can happen with some account configurations)
      const mockUsageResponse = {
        data: [
          {
            starting_at: '2024-01-01T00:00:00Z',
            results: [
              {
                model: 'claude-3-opus-20240229',
                uncached_input_tokens: 800,
                cache_read_input_tokens: 200,
                output_tokens: 500,
                // num_requests missing — falls back to 0
              },
            ],
          },
        ],
        has_more: false,
      };

      // Cost API returns num_requests alongside amount
      const mockCostResponse = {
        data: [
          {
            starting_at: '2024-01-01T00:00:00Z',
            results: [
              {
                description: 'claude-3-opus-20240229',
                amount: '2.325',
                num_requests: 12,
              },
            ],
          },
        ],
        has_more: false,
      };

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => mockUsageResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockCostResponse });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      const records = await anthropicAdapter.fetchUsage('sk-ant-test', startDate, endDate);

      expect(records).toHaveLength(1);
      // Should use request count from Cost API since Usage API returned 0
      expect(records[0].requests).toBe(12);
      expect(records[0].costUsd).toBeCloseTo(0.02325, 4);
    });
  });

  describe('Google AI Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ models: [] }),
      });

      const result = await googleAdapter.validateKey('AIzaSyTest123');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyTest123'
      );
    });

    it('validateKey throws on 403', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'API key not valid' } }),
      });

      await expect(googleAdapter.validateKey('bad-key')).rejects.toThrow('API key not valid');
    });

    it('fetchUsage returns empty array (no usage API for API keys)', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ tunedModels: [] }),
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const records = await googleAdapter.fetchUsage('AIzaSyTest', startDate, endDate);
      expect(records).toEqual([]);
    });
  });

  describe('DeepSeek Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'deepseek-chat' }] }),
      });

      const result = await deepseekAdapter.validateKey('sk-deepseek-test');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-deepseek-test' },
        })
      );
    });

    it('validateKey throws on error', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(deepseekAdapter.validateKey('bad-key')).rejects.toThrow('Invalid API key');
    });

    it('fetchUsage parses DeepSeek billing response', async () => {
      const mockBillingResponse = {
        daily_costs: [
          {
            date: '2024-01-15',
            line_items: [
              {
                name: 'deepseek-chat',
                input_tokens: 5000,
                output_tokens: 2000,
                num_requests: 20,
                cost: 0.0013,
              },
              {
                name: 'deepseek-reasoner',
                input_tokens: 1000,
                output_tokens: 3000,
                num_requests: 5,
                cost: 0.007,
              },
            ],
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockBillingResponse,
      });

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const records = await deepseekAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'deepseek-chat',
          inputTokens: 5000,
          outputTokens: 2000,
          requests: 20,
          costUsd: 0.0013,
        })
      );
      expect(records[1]).toEqual(
        expect.objectContaining({
          model: 'deepseek-reasoner',
          requests: 5,
        })
      );
    });

    it('fetchUsage falls back to OpenAI-compat endpoint', async () => {
      // First call (billing endpoint) fails
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });
      // Fallback call succeeds with empty
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ daily_costs: [] }),
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const records = await deepseekAdapter.fetchUsage('sk-test', startDate, endDate);
      expect(records).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mistral Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await mistralAdapter.validateKey('test-key-123');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/models',
        expect.objectContaining({ headers: { Authorization: 'Bearer test-key-123' } })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(mistralAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Mistral API key'
      );
    });

    it('validateKey throws with API message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(mistralAdapter.validateKey('sk-test')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage API fails', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T23:59:59Z');
      const records = await mistralAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toEqual([]);
    });

    it('fetchUsage parses daily per-model response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              period: '2024-01-15',
              models: [
                { model: 'mistral-large-latest', input_tokens: 2000, output_tokens: 800, requests: 5 },
              ],
            },
          ],
        }),
      });

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');
      const records = await mistralAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0].date).toBe('2024-01-15');
      expect(records[0].model).toBe('mistral-large-latest');
      expect(records[0].inputTokens).toBe(2000);
      expect(records[0].outputTokens).toBe(800);
      expect(records[0].requests).toBe(5);
      expect(records[0].costUsd).toBeGreaterThan(0);
    });

    it('fetchUsage parses flat models array response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            { model: 'mistral-small-latest', input_tokens: 500, output_tokens: 200, requests: 2 },
          ],
        }),
      });

      const startDate = new Date('2024-01-10T00:00:00Z');
      const endDate = new Date('2024-01-10T23:59:59Z');
      const records = await mistralAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('mistral-small-latest');
      expect(records[0].inputTokens).toBe(500);
      expect(records[0].outputTokens).toBe(200);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              period: '2024-01-20',
              models: [
                { model: 'mistral-large-latest', input_tokens: 0, output_tokens: 0, requests: 0 },
                { model: 'codestral-latest', input_tokens: 1000, output_tokens: 400, requests: 3 },
              ],
            },
          ],
        }),
      });

      const startDate = new Date('2024-01-20T00:00:00Z');
      const endDate = new Date('2024-01-20T23:59:59Z');
      const records = await mistralAdapter.fetchUsage('sk-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('codestral-latest');
    });

    it('fetchUsage uses provided cost if present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              period: '2024-01-25',
              models: [
                { model: 'mistral-large-latest', input_tokens: 1000, output_tokens: 500, requests: 1, cost: 0.0123 },
              ],
            },
          ],
        }),
      });

      const records = await mistralAdapter.fetchUsage('sk-test', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.0123);
    });
  });

  describe('Azure Adapter', () => {
    const validCreds = 'https://my-resource.openai.azure.com/::azure-api-key-123';

    describe('parseAzureCredentials', () => {
      it('parses valid endpoint::apiKey format', () => {
        const result = parseAzureCredentials(validCreds);
        expect(result.endpoint).toBe('https://my-resource.openai.azure.com/');
        expect(result.apiKey).toBe('azure-api-key-123');
      });

      it('throws when separator is missing', () => {
        expect(() => parseAzureCredentials('https://example.openai.azure.com/only-key'))
          .toThrow('Azure credentials must be in the format');
      });

      it('throws when endpoint does not start with https://', () => {
        expect(() => parseAzureCredentials('http://resource.openai.azure.com/::key'))
          .toThrow('Azure endpoint must start with https://');
      });

      it('throws when apiKey is empty', () => {
        expect(() => parseAzureCredentials('https://resource.openai.azure.com/::'))
          .toThrow('Azure API key is missing');
      });
    });

    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await azureAdapter.validateKey(validCreds);
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://my-resource.openai.azure.com/openai/deployments?api-version=2024-02-01',
        expect.objectContaining({
          headers: { 'api-key': 'azure-api-key-123' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Access denied' } }),
      });

      await expect(azureAdapter.validateKey(validCreds)).rejects.toThrow('Access denied');
    });

    it('validateKey throws on 404 with endpoint hint', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(azureAdapter.validateKey(validCreds)).rejects.toThrow('endpoint not found');
    });

    it('validateKey throws on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(azureAdapter.validateKey(validCreds)).rejects.toThrow('Internal server error');
    });

    it('fetchUsage returns empty array (no billing API via API key)', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const records = await azureAdapter.fetchUsage(validCreds, startDate, endDate);
      expect(records).toEqual([]);
      // No HTTP call should be made — Azure billing requires Azure AD auth
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('xAI Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'grok-3' }] }),
      });

      const result = await xaiAdapter.validateKey('xai-test-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.x.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer xai-test-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(xaiAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid xAI API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(xaiAdapter.validateKey('xai-test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T23:59:59Z');
      const records = await xaiAdapter.fetchUsage('xai-test', startDate, endDate);

      expect(records).toEqual([]);
    });

    it('fetchUsage parses usage data array when endpoint returns records', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'grok-3',
              input_tokens: 4000,
              output_tokens: 1000,
              requests: 8,
            },
            {
              date: '2024-01-15',
              model: 'grok-3-mini',
              input_tokens: 10000,
              output_tokens: 3000,
              requests: 20,
            },
          ],
        }),
      });

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');
      const records = await xaiAdapter.fetchUsage('xai-test', startDate, endDate);

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'grok-3',
          inputTokens: 4000,
          outputTokens: 1000,
          requests: 8,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('grok-3-mini');
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'grok-3', input_tokens: 0, output_tokens: 0, requests: 0 },
            { date: '2024-01-20', model: 'grok-3-mini', input_tokens: 500, output_tokens: 200, requests: 2 },
          ],
        }),
      });

      const records = await xaiAdapter.fetchUsage('xai-test', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('grok-3-mini');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'grok-3', input_tokens: 1000, output_tokens: 500, requests: 1, cost: 0.0075 },
          ],
        }),
      });

      const records = await xaiAdapter.fetchUsage('xai-test', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.0075);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await xaiAdapter.fetchUsage('xai-test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('Cohere Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ models: [{ name: 'command-r-plus' }] }),
      });

      const result = await cohereAdapter.validateKey('test-cohere-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.cohere.com/v2/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-cohere-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(cohereAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Cohere API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(cohereAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const records = await cohereAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage parses billed_units usage data', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'command-r-plus',
              billed_units: { input_tokens: 5000, output_tokens: 1500 },
              requests: 10,
            },
            {
              date: '2024-01-15',
              model: 'command-r',
              input_tokens: 12000,
              output_tokens: 4000,
              requests: 25,
            },
          ],
        }),
      });

      const records = await cohereAdapter.fetchUsage('test-key', new Date('2024-01-15'), new Date('2024-01-15'));

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'command-r-plus',
          inputTokens: 5000,
          outputTokens: 1500,
          requests: 10,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('command-r');
      expect(records[1].inputTokens).toBe(12000);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'command-r-plus', billed_units: { input_tokens: 0, output_tokens: 0 }, requests: 0 },
            { date: '2024-01-20', model: 'command-r', input_tokens: 800, output_tokens: 300, requests: 3 },
          ],
        }),
      });

      const records = await cohereAdapter.fetchUsage('test-key', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('command-r');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'command-r-plus', input_tokens: 1000, output_tokens: 500, requests: 1, cost: 0.005 },
          ],
        }),
      });

      const records = await cohereAdapter.fetchUsage('test-key', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.005);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await cohereAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('Groq Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'llama-3.3-70b-versatile' }] }),
      });

      const result = await groqAdapter.validateKey('gsk_test-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer gsk_test-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(groqAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Groq API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(groqAdapter.validateKey('gsk_test')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const records = await groqAdapter.fetchUsage('gsk_test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage parses usage data with prompt_tokens/completion_tokens', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'llama-3.3-70b-versatile',
              prompt_tokens: 8000,
              completion_tokens: 2000,
              total_requests: 15,
            },
            {
              date: '2024-01-15',
              model: 'llama-3.1-8b-instant',
              input_tokens: 20000,
              output_tokens: 5000,
              requests: 40,
            },
          ],
        }),
      });

      const records = await groqAdapter.fetchUsage('gsk_test', new Date('2024-01-15'), new Date('2024-01-15'));

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'llama-3.3-70b-versatile',
          inputTokens: 8000,
          outputTokens: 2000,
          requests: 15,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('llama-3.1-8b-instant');
      expect(records[1].inputTokens).toBe(20000);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'llama-3.3-70b-versatile', prompt_tokens: 0, completion_tokens: 0, total_requests: 0 },
            { date: '2024-01-20', model: 'llama-3.1-8b-instant', prompt_tokens: 1000, completion_tokens: 400, requests: 5 },
          ],
        }),
      });

      const records = await groqAdapter.fetchUsage('gsk_test', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('llama-3.1-8b-instant');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'llama-3.3-70b-versatile', prompt_tokens: 2000, completion_tokens: 800, requests: 2, cost: 0.00182 },
          ],
        }),
      });

      const records = await groqAdapter.fetchUsage('gsk_test', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.00182);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await groqAdapter.fetchUsage('gsk_test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('togetherAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' }] }),
      });

      const result = await togetherAdapter.validateKey('test-together-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.together.xyz/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-together-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(togetherAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Together AI API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(togetherAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const records = await togetherAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage parses usage data with prompt_tokens/completion_tokens', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
              prompt_tokens: 8000,
              completion_tokens: 2000,
              num_requests: 15,
            },
            {
              date: '2024-01-15',
              model: 'deepseek-ai/DeepSeek-R1',
              input_tokens: 20000,
              output_tokens: 5000,
              requests: 40,
            },
          ],
        }),
      });

      const records = await togetherAdapter.fetchUsage('test-key', new Date('2024-01-15'), new Date('2024-01-15'));

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          inputTokens: 8000,
          outputTokens: 2000,
          requests: 15,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('deepseek-ai/DeepSeek-R1');
      expect(records[1].inputTokens).toBe(20000);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', prompt_tokens: 0, completion_tokens: 0, num_requests: 0 },
            { date: '2024-01-20', model: 'Qwen/Qwen2.5-7B-Instruct-Turbo', prompt_tokens: 1000, completion_tokens: 400, requests: 5 },
          ],
        }),
      });

      const records = await togetherAdapter.fetchUsage('test-key', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('Qwen/Qwen2.5-7B-Instruct-Turbo');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', prompt_tokens: 2000, completion_tokens: 800, requests: 2, cost: 0.00249 },
          ],
        }),
      });

      const records = await togetherAdapter.fetchUsage('test-key', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.00249);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await togetherAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('fireworksAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'accounts/fireworks/models/llama-v3p3-70b-instruct' }] }),
      });

      const result = await fireworksAdapter.validateKey('fw_test-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.fireworks.ai/inference/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer fw_test-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(fireworksAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Fireworks AI API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(fireworksAdapter.validateKey('fw_test')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const records = await fireworksAdapter.fetchUsage('fw_test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage parses usage data with prompt_tokens/completion_tokens', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
              prompt_tokens: 8000,
              completion_tokens: 2000,
              total_requests: 15,
            },
            {
              date: '2024-01-15',
              model: 'accounts/fireworks/models/deepseek-r1',
              input_tokens: 20000,
              output_tokens: 5000,
              requests: 40,
            },
          ],
        }),
      });

      const records = await fireworksAdapter.fetchUsage('fw_test', new Date('2024-01-15'), new Date('2024-01-15'));

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
          inputTokens: 8000,
          outputTokens: 2000,
          requests: 15,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('accounts/fireworks/models/deepseek-r1');
      expect(records[1].inputTokens).toBe(20000);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', prompt_tokens: 0, completion_tokens: 0, total_requests: 0 },
            { date: '2024-01-20', model: 'accounts/fireworks/models/gemma2-9b-it', prompt_tokens: 1000, completion_tokens: 400, requests: 5 },
          ],
        }),
      });

      const records = await fireworksAdapter.fetchUsage('fw_test', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('accounts/fireworks/models/gemma2-9b-it');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'accounts/fireworks/models/llama-v3p3-70b-instruct', prompt_tokens: 2000, completion_tokens: 800, requests: 2, cost: 0.00249 },
          ],
        }),
      });

      const records = await fireworksAdapter.fetchUsage('fw_test', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.00249);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await fireworksAdapter.fetchUsage('fw_test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('perplexityAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'sonar', object: 'model' }] }),
      });

      const result = await perplexityAdapter.validateKey('pplx-test-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.perplexity.ai/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer pplx-test-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(perplexityAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Perplexity AI API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(perplexityAdapter.validateKey('pplx-test')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('fetchUsage returns empty array when usage endpoint returns 404', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

      const records = await perplexityAdapter.fetchUsage('pplx-test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage parses usage data with prompt_tokens/completion_tokens', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              date: '2024-01-15',
              model: 'sonar-pro',
              prompt_tokens: 8000,
              completion_tokens: 2000,
              total_requests: 15,
            },
            {
              date: '2024-01-15',
              model: 'sonar-reasoning',
              input_tokens: 20000,
              output_tokens: 5000,
              requests: 40,
            },
          ],
        }),
      });

      const records = await perplexityAdapter.fetchUsage('pplx-test', new Date('2024-01-15'), new Date('2024-01-15'));

      expect(records).toHaveLength(2);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-15',
          model: 'sonar-pro',
          inputTokens: 8000,
          outputTokens: 2000,
          requests: 15,
        })
      );
      expect(records[0].costUsd).toBeGreaterThan(0);
      expect(records[1].model).toBe('sonar-reasoning');
      expect(records[1].inputTokens).toBe(20000);
    });

    it('fetchUsage skips zero-token rows', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-20', model: 'sonar', prompt_tokens: 0, completion_tokens: 0, total_requests: 0 },
            { date: '2024-01-20', model: 'sonar-pro', prompt_tokens: 1000, completion_tokens: 400, requests: 5 },
          ],
        }),
      });

      const records = await perplexityAdapter.fetchUsage('pplx-test', new Date('2024-01-20'), new Date('2024-01-20'));
      expect(records).toHaveLength(1);
      expect(records[0].model).toBe('sonar-pro');
    });

    it('fetchUsage uses provided cost when present', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { date: '2024-01-25', model: 'sonar-pro', prompt_tokens: 2000, completion_tokens: 800, requests: 2, cost: 0.01642 },
          ],
        }),
      });

      const records = await perplexityAdapter.fetchUsage('pplx-test', new Date('2024-01-25'), new Date('2024-01-25'));
      expect(records[0].costUsd).toBe(0.01642);
    });

    it('fetchUsage returns empty array when fetch throws', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const records = await perplexityAdapter.fetchUsage('pplx-test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(records).toEqual([]);
    });
  });

  describe('cerebrasAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ object: 'list', data: [{ id: 'llama3.1-8b' }] }),
      });

      const result = await cerebrasAdapter.validateKey('csk-test-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.cerebras.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer csk-test-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(cerebrasAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Cerebras API key'
      );
    });

    it('validateKey throws with API error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(cerebrasAdapter.validateKey('csk-test')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws with status code when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(cerebrasAdapter.validateKey('csk-test')).rejects.toThrow(
        'Cerebras API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await cerebrasAdapter.fetchUsage('csk-test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await cerebrasAdapter.fetchUsage('csk-test', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await cerebrasAdapter.fetchUsage('csk-test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('cerebrasAdapter.type is cerebras', () => {
      expect(cerebrasAdapter.type).toBe('cerebras');
    });
  });

  describe('ai21Adapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ([{ id: 'jamba-1.5-mini', object: 'model' }]),
      });

      const result = await ai21Adapter.validateKey('test-ai21-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.ai21.com/studio/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-ai21-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Authentication credentials were not provided.' }),
      });

      await expect(ai21Adapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid AI21 Labs API key'
      );
    });

    it('validateKey throws with detail message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Rate limit exceeded' }),
      });

      await expect(ai21Adapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws with status code when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(ai21Adapter.validateKey('test-key')).rejects.toThrow(
        'AI21 Labs API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await ai21Adapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await ai21Adapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await ai21Adapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ai21Adapter.type is ai21', () => {
      expect(ai21Adapter.type).toBe('ai21');
    });
  });

  describe('deepinfraAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'meta-llama/Llama-3.3-70B-Instruct', object: 'model' }] }),
      });

      const result = await deepinfraAdapter.validateKey('test-deepinfra-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.deepinfra.com/v1/openai/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-deepinfra-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      await expect(deepinfraAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid DeepInfra API key'
      );
    });

    it('validateKey throws with error message on other errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(deepinfraAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws with status code when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(deepinfraAdapter.validateKey('test-key')).rejects.toThrow(
        'DeepInfra API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await deepinfraAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await deepinfraAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await deepinfraAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('deepinfraAdapter.type is deepinfra', () => {
      expect(deepinfraAdapter.type).toBe('deepinfra');
    });
  });

  describe('novitaAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'meta-llama/llama-3.3-70b-instruct', object: 'model' }] }),
      });

      const result = await novitaAdapter.validateKey('test-novita-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.novita.ai/v3/openai/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-novita-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(novitaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Novita AI API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(novitaAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(novitaAdapter.validateKey('test-key')).rejects.toThrow(
        'Novita AI API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await novitaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await novitaAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await novitaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('novitaAdapter.type is novita', () => {
      expect(novitaAdapter.type).toBe('novita');
    });
  });

  describe('hyperbolicAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await hyperbolicAdapter.validateKey('test-hyperbolic-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.hyperbolic.xyz/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-hyperbolic-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(hyperbolicAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Hyperbolic API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(hyperbolicAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(hyperbolicAdapter.validateKey('test-key')).rejects.toThrow(
        'Hyperbolic API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await hyperbolicAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await hyperbolicAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await hyperbolicAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('hyperbolicAdapter.type is hyperbolic', () => {
      expect(hyperbolicAdapter.type).toBe('hyperbolic');
    });
  });

  describe('sambanovaAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await sambanovaAdapter.validateKey('test-sambanova-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.sambanova.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-sambanova-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(sambanovaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid SambaNova API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(sambanovaAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(sambanovaAdapter.validateKey('test-key')).rejects.toThrow(
        'SambaNova API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await sambanovaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await sambanovaAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await sambanovaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sambanovaAdapter.type is sambanova', () => {
      expect(sambanovaAdapter.type).toBe('sambanova');
    });
  });

  describe('lambdalabsAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await lambdalabsAdapter.validateKey('test-lambdalabs-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.lambdalabs.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-lambdalabs-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(lambdalabsAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Lambda Labs API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(lambdalabsAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(lambdalabsAdapter.validateKey('test-key')).rejects.toThrow(
        'Lambda Labs API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await lambdalabsAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await lambdalabsAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await lambdalabsAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('lambdalabsAdapter.type is lambdalabs', () => {
      expect(lambdalabsAdapter.type).toBe('lambdalabs');
    });
  });

  describe('leptonAdapter', () => {
    it('validateKey returns true for a valid key', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await leptonAdapter.validateKey('valid-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://llm.lepton.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(leptonAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Lepton AI API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(leptonAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(leptonAdapter.validateKey('test-key')).rejects.toThrow(
        'Lepton AI API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await leptonAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await leptonAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await leptonAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('leptonAdapter.type is lepton', () => {
      expect(leptonAdapter.type).toBe('lepton');
    });
  });

  describe('inferencenetAdapter', () => {
    it('validateKey returns true for a valid key', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await inferencenetAdapter.validateKey('inf-valid-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.inference.net/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer inf-valid-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(inferencenetAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Inference.net API key'
      );
    });

    it('validateKey throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(inferencenetAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('validateKey throws generic message when no error body', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(inferencenetAdapter.validateKey('test-key')).rejects.toThrow(
        'Inference.net API returned 503'
      );
    });

    it('fetchUsage always returns empty array (no public usage API)', async () => {
      const records = await inferencenetAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await inferencenetAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await inferencenetAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('inferencenetAdapter.type is inferencenet', () => {
      expect(inferencenetAdapter.type).toBe('inferencenet');
    });
  });

  describe('nvidiaAdapter', () => {
    it('validates a correct NVIDIA API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await nvidiaAdapter.validateKey('nvapi-valid-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://integrate.api.nvidia.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer nvapi-valid-key' },
        })
      );
    });

    it('throws on 401 with helpful message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      await expect(nvidiaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid NVIDIA API key'
      );
    });

    it('throws on non-401 error with API message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(nvidiaAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('throws with status code when no error body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => { throw new Error('not json'); },
      });

      await expect(nvidiaAdapter.validateKey('test-key')).rejects.toThrow(
        'NVIDIA API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await nvidiaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await nvidiaAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await nvidiaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('nvidiaAdapter.type is nvidia', () => {
      expect(nvidiaAdapter.type).toBe('nvidia');
    });
  });

  describe('cloudflareAdapter', () => {
    describe('parseCloudflareCredentials', () => {
      it('parses valid accountId::apiToken format', () => {
        const result = parseCloudflareCredentials('abc123::my-api-token');
        expect(result.accountId).toBe('abc123');
        expect(result.apiToken).toBe('my-api-token');
      });

      it('throws when :: separator is missing', () => {
        expect(() => parseCloudflareCredentials('justanapitoken'))
          .toThrow('Cloudflare credentials must be in the format');
      });

      it('throws when accountId is empty', () => {
        expect(() => parseCloudflareCredentials('::my-api-token'))
          .toThrow('Account ID is missing');
      });

      it('throws when apiToken is empty', () => {
        expect(() => parseCloudflareCredentials('abc123::'))
          .toThrow('API token is missing');
      });
    });

    it('validates key successfully', async () => {
      const validCreds = 'abc123def456::my-cloudflare-token';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, result: [] }),
      });

      const result = await cloudflareAdapter.validateKey(validCreds);
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.cloudflare.com/client/v4/accounts/abc123def456/ai/models/search?search=llama',
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-cloudflare-token' },
        })
      );
    });

    it('throws on 401 with helpful message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ errors: [{ message: 'Invalid API token' }] }),
      });

      await expect(cloudflareAdapter.validateKey('acc::bad-token')).rejects.toThrow(
        'Invalid API token'
      );
    });

    it('throws on 404 with account not found message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(cloudflareAdapter.validateKey('bad-acc::token')).rejects.toThrow(
        'Cloudflare account not found'
      );
    });

    it('throws on non-401/404 error with API message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ errors: [{ message: 'Internal server error' }] }),
      });

      await expect(cloudflareAdapter.validateKey('acc::token')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await cloudflareAdapter.fetchUsage('acc::token', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await cloudflareAdapter.fetchUsage('acc::token', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await cloudflareAdapter.fetchUsage('acc::token', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('cloudflareAdapter.type is cloudflare', () => {
      expect(cloudflareAdapter.type).toBe('cloudflare');
    });
  });

  describe('nebiusAdapter', () => {
    it('validates key successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', data: [] }),
      });

      const result = await nebiusAdapter.validateKey('eyJhbGci_test_key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.studio.nebius.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer eyJhbGci_test_key' },
        })
      );
    });

    it('throws on 401 with helpful message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(nebiusAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Nebius AI API key'
      );
    });

    it('throws on non-401 error with status code', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      await expect(nebiusAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('throws on error with fallback message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(nebiusAdapter.validateKey('test-key')).rejects.toThrow(
        'Nebius AI API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await nebiusAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetchUsage returns empty array for any date range', async () => {
      const records = await nebiusAdapter.fetchUsage('test-key', new Date('2024-06-01'), new Date('2024-06-30'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await nebiusAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('nebiusAdapter.type is nebius', () => {
      expect(nebiusAdapter.type).toBe('nebius');
    });
  });

  describe('replicateAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', type: 'user' }),
      });

      const result = await replicateAdapter.validateKey('r8_test_key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.replicate.com/v1/account',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Token r8_test_key' }),
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid token' }),
      });

      await expect(replicateAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Replicate API token'
      );
    });

    it('validateKey throws with API message on other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(replicateAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('validateKey throws generic message when no body detail', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(replicateAdapter.validateKey('test-key')).rejects.toThrow(
        'Replicate API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await replicateAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await replicateAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('replicateAdapter.type is replicate', () => {
      expect(replicateAdapter.type).toBe('replicate');
    });
  });

  describe('featherlessAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'meta-llama/Llama-3.3-70B-Instruct' }] }),
      });

      const result = await featherlessAdapter.validateKey('test-featherless-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.featherless.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-featherless-key' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(featherlessAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Featherless API key'
      );
    });

    it('validateKey throws with API message on other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(featherlessAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('validateKey throws generic message when no body detail', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(featherlessAdapter.validateKey('test-key')).rejects.toThrow(
        'Featherless API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await featherlessAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await featherlessAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('featherlessAdapter.type is featherless', () => {
      expect(featherlessAdapter.type).toBe('featherless');
    });
  });

  describe('huggingfaceAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'test-user', type: 'user' }),
      });

      const result = await huggingfaceAdapter.validateKey('hf_test_token');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://huggingface.co/api/whoami',
        expect.objectContaining({
          headers: { Authorization: 'Bearer hf_test_token' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      await expect(huggingfaceAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid HuggingFace token'
      );
    });

    it('validateKey throws with API message on other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(huggingfaceAdapter.validateKey('hf_test')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('validateKey throws generic message when no body detail', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(huggingfaceAdapter.validateKey('hf_test')).rejects.toThrow(
        'HuggingFace API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await huggingfaceAdapter.fetchUsage('hf_test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await huggingfaceAdapter.fetchUsage('hf_test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('huggingfaceAdapter.type is huggingface', () => {
      expect(huggingfaceAdapter.type).toBe('huggingface');
    });

    it('validateKey rethrows non-JSON error responses gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => { throw new SyntaxError('invalid json'); },
      });

      await expect(huggingfaceAdapter.validateKey('hf_test')).rejects.toThrow(
        'HuggingFace API returned 429'
      );
    });
  });

  describe('yiAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await yiAdapter.validateKey('test-yi-key');
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.lingyiwanwu.com/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-yi-key' },
        })
      );
    });

    it('validateKey throws on 401 with a friendly message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(yiAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid 01.AI API key. Get your key from platform.lingyiwanwu.com/apikeys.'
      );
    });

    it('validateKey throws with API message on other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(yiAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('validateKey throws generic message when no body detail', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(yiAdapter.validateKey('test-key')).rejects.toThrow(
        '01.AI API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await yiAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await yiAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('yiAdapter.type is yi', () => {
      expect(yiAdapter.type).toBe('yi');
    });

    it('validateKey throws with message field on other errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      });

      await expect(yiAdapter.validateKey('test-key')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('zhipuAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await zhipuAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Zhipu AI models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await zhipuAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://open.bigmodel.cn/api/paas/v4/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-key' },
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(zhipuAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Zhipu AI API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(zhipuAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(zhipuAdapter.validateKey('test-key')).rejects.toThrow(
        'Zhipu AI API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await zhipuAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await zhipuAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('zhipuAdapter.type is zhipu', () => {
      expect(zhipuAdapter.type).toBe('zhipu');
    });
  });

  describe('upstageAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await upstageAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Upstage models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await upstageAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.upstage.ai/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-key' },
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(upstageAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Upstage API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(upstageAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(upstageAdapter.validateKey('test-key')).rejects.toThrow(
        'Upstage API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await upstageAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await upstageAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('upstageAdapter.type is upstage', () => {
      expect(upstageAdapter.type).toBe('upstage');
    });
  });

  describe('moonshotAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await moonshotAdapter.validateKey('sk-test');
      expect(result).toBe(true);
    });

    it('validateKey calls Moonshot AI models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await moonshotAdapter.validateKey('sk-test');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.moonshot.cn/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-test' },
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(moonshotAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Moonshot AI API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(moonshotAdapter.validateKey('sk-test')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(moonshotAdapter.validateKey('sk-test')).rejects.toThrow(
        'Moonshot AI API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await moonshotAdapter.fetchUsage('sk-test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await moonshotAdapter.fetchUsage('sk-test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('moonshotAdapter.type is moonshot', () => {
      expect(moonshotAdapter.type).toBe('moonshot');
    });
  });
});
