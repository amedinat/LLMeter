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
import { writerAdapter } from './writer-adapter';
import { qwenAdapter } from './qwen-adapter';
import { minimaxAdapter } from './minimax-adapter';
import { doubaoAdapter } from './doubao-adapter';
import { hunyuanAdapter } from './hunyuan-adapter';
import { baichuanAdapter } from './baichuan-adapter';
import { siliconflowAdapter } from './siliconflow-adapter';
import { stepfunAdapter } from './stepfun-adapter';
import { baiduAdapter } from './baidu-adapter';
import { klusterAdapter } from './kluster-adapter';
import { friendliAdapter } from './friendli-adapter';
import { llamaapiAdapter } from './llamaapi-adapter';
import { rekaAdapter } from './reka-adapter';
import { maritacaAdapter } from './maritaca-adapter';
import { scalewayAdapter } from './scaleway-adapter';
import { nscaleAdapter } from './nscale-adapter';
import { aimlapiAdapter } from './aimlapi-adapter';
import { bedrockAdapter, parseBedrockCredentials } from './bedrock-adapter';
import { alephAlphaAdapter } from './alephalpha-adapter';
import { sarvamAdapter } from './sarvam-adapter';
import { chutesAdapter } from './chutes-adapter';
import { krutrimAdapter } from './krutrim-adapter';
import { ovhcloudAdapter } from './ovhcloud-adapter';
import { telnyxAdapter } from './telnyx-adapter';
import { vultrAdapter } from './vultr-adapter';
import { ai71Adapter } from './ai71-adapter';
import { gcoreAdapter } from './gcore-adapter';
import { crusoeAdapter } from './crusoe-adapter';
import { databricksAdapter } from './databricks-adapter';
import { gradientAdapter } from './gradient-adapter';
import { basetenAdapter } from './baseten-adapter';
import { watsonxAdapter, parseWatsonXCredentials } from './watsonx-adapter';
import { snowflakeAdapter, parseSnowflakeCredentials } from './snowflake-adapter';
import { neetsAdapter } from './neets-adapter';
import { runpodAdapter } from './runpod-adapter';
import { predibaseAdapter } from './predibase-adapter';
import { vertexaiAdapter, parseVertexAICredentials } from './vertexai-adapter';
import { sparkAdapter } from './spark-adapter';
import { ionetAdapter } from './ionet-adapter';
import { ociAdapter, parseOCICredentials } from './oci-adapter';
import { gigachatAdapter } from './gigachat-adapter';
import { githubAdapter } from './github-adapter';
import { parasailAdapter } from './parasail-adapter';
import { openpipeAdapter } from './openpipe-adapter';
import { corcelAdapter } from './corcel-adapter';
import { inceptionAdapter } from './inception-adapter';
import { liquidAdapter } from './liquid-adapter';
import { zyphraAdapter } from './zyphra-adapter';
import { akashAdapter } from './akash-adapter';
import { arceeAdapter } from './arcee-adapter';
import { centmlAdapter } from './centml-adapter';
import { veniceAdapter } from './venice-adapter';
import { inferlessAdapter } from './inferless-adapter';
import { codestralAdapter } from './codestral-adapter';
import { fluidstackAdapter } from './fluidstack-adapter';
import { monsterapiAdapter } from './monsterapi-adapter';
import { coreweaveAdapter } from './coreweave-adapter';
import { premAdapter } from './prem-adapter';

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

  describe('writerAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await writerAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Writer models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await writerAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.writer.com/v1/models',
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

      await expect(writerAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Writer API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(writerAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(writerAdapter.validateKey('test-key')).rejects.toThrow(
        'Writer API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await writerAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await writerAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('writerAdapter.type is writer', () => {
      expect(writerAdapter.type).toBe('writer');
    });
  });

  describe('qwenAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await qwenAdapter.validateKey('sk-test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls DashScope models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await qwenAdapter.validateKey('sk-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
        expect.objectContaining({
          headers: { Authorization: 'Bearer sk-test-key' },
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(qwenAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Qwen API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(qwenAdapter.validateKey('sk-test')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(qwenAdapter.validateKey('sk-test')).rejects.toThrow(
        'Qwen API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await qwenAdapter.fetchUsage('sk-test', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await qwenAdapter.fetchUsage('sk-test', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('qwenAdapter.type is qwen', () => {
      expect(qwenAdapter.type).toBe('qwen');
    });
  });

  describe('minimaxAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await minimaxAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls MiniMax models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await minimaxAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.minimaxi.chat/v1/models',
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

      await expect(minimaxAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid MiniMax API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(minimaxAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(minimaxAdapter.validateKey('test-key')).rejects.toThrow(
        'MiniMax API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await minimaxAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await minimaxAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('minimaxAdapter.type is minimax', () => {
      expect(minimaxAdapter.type).toBe('minimax');
    });
  });

  describe('doubaoAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await doubaoAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Volcengine Ark models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await doubaoAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://ark.cn-beijing.volces.com/api/v3/models',
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

      await expect(doubaoAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Doubao API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(doubaoAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(doubaoAdapter.validateKey('test-key')).rejects.toThrow(
        'Doubao API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await doubaoAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await doubaoAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('doubaoAdapter.type is doubao', () => {
      expect(doubaoAdapter.type).toBe('doubao');
    });
  });

  describe('hunyuanAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await hunyuanAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Hunyuan models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await hunyuanAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.hunyuan.cloud.tencent.com/v1/models',
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

      await expect(hunyuanAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Hunyuan API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(hunyuanAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(hunyuanAdapter.validateKey('test-key')).rejects.toThrow(
        'Hunyuan API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await hunyuanAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await hunyuanAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('hunyuanAdapter.type is hunyuan', () => {
      expect(hunyuanAdapter.type).toBe('hunyuan');
    });
  });

  describe('baichuanAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await baichuanAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Baichuan models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await baichuanAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.baichuan-ai.com/v1/models',
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

      await expect(baichuanAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Baichuan API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(baichuanAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(baichuanAdapter.validateKey('test-key')).rejects.toThrow(
        'Baichuan API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await baichuanAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await baichuanAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('baichuanAdapter.type is baichuan', () => {
      expect(baichuanAdapter.type).toBe('baichuan');
    });
  });

  describe('siliconflowAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await siliconflowAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls SiliconFlow models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await siliconflowAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.siliconflow.cn/v1/models',
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

      await expect(siliconflowAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid SiliconFlow API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(siliconflowAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(siliconflowAdapter.validateKey('test-key')).rejects.toThrow(
        'SiliconFlow API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await siliconflowAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await siliconflowAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('siliconflowAdapter.type is siliconflow', () => {
      expect(siliconflowAdapter.type).toBe('siliconflow');
    });
  });

  describe('stepfunAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await stepfunAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Stepfun models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await stepfunAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.stepfun.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(stepfunAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Stepfun API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(stepfunAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(stepfunAdapter.validateKey('test-key')).rejects.toThrow(
        'Stepfun API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await stepfunAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await stepfunAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('stepfunAdapter.type is stepfun', () => {
      expect(stepfunAdapter.type).toBe('stepfun');
    });
  });

  describe('baiduAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await baiduAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Baidu Qianfan models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await baiduAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://qianfan.baidubce.com/v2/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(baiduAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Baidu API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(baiduAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(baiduAdapter.validateKey('test-key')).rejects.toThrow(
        'Baidu API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await baiduAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await baiduAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('baiduAdapter.type is baidu', () => {
      expect(baiduAdapter.type).toBe('baidu');
    });
  });

  describe('klusterAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await klusterAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Kluster AI models endpoint with Bearer token', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await klusterAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.kluster.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(klusterAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Kluster API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(klusterAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(klusterAdapter.validateKey('test-key')).rejects.toThrow(
        'Kluster API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await klusterAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await klusterAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('klusterAdapter.type is kluster', () => {
      expect(klusterAdapter.type).toBe('kluster');
    });
  });

  describe('friendliAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await friendliAdapter.validateKey('test-token');
      expect(result).toBe(true);
    });

    it('validateKey calls Friendli AI models endpoint with Bearer token', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await friendliAdapter.validateKey('test-token');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://inference.friendli.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(friendliAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid Friendli AI API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(friendliAdapter.validateKey('test-token')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(friendliAdapter.validateKey('test-token')).rejects.toThrow(
        'Friendli AI returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await friendliAdapter.fetchUsage('test-token', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await friendliAdapter.fetchUsage('test-token', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('friendliAdapter.type is friendli', () => {
      expect(friendliAdapter.type).toBe('friendli');
    });
  });

  describe('llamaapiAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await llamaapiAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Llama API models endpoint with Bearer token', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await llamaapiAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.llama.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(llamaapiAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Llama API key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(llamaapiAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(llamaapiAdapter.validateKey('test-key')).rejects.toThrow(
        'Llama API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await llamaapiAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await llamaapiAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('llamaapiAdapter.type is llamaapi', () => {
      expect(llamaapiAdapter.type).toBe('llamaapi');
    });
  });

  describe('rekaAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const result = await rekaAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Reka AI models endpoint with Bearer token', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      await rekaAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.reka.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(rekaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Reka AI key'
      );
    });

    it('validateKey throws with error.message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(rekaAdapter.validateKey('test-key')).rejects.toThrow(
        'Invalid request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(rekaAdapter.validateKey('test-key')).rejects.toThrow(
        'Reka AI returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await rekaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await rekaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rekaAdapter.type is reka', () => {
      expect(rekaAdapter.type).toBe('reka');
    });
  });

  describe('maritacaAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hi' } }] }),
      });

      const result = await maritacaAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Maritaca AI chat endpoint with Key auth', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      await maritacaAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://chat.maritaca.ai/api/chat/inference',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Key test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(maritacaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Maritaca AI key'
      );
    });

    it('validateKey throws on 403 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(maritacaAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Maritaca AI key'
      );
    });

    it('validateKey throws with message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(maritacaAdapter.validateKey('test-key')).rejects.toThrow(
        'Bad request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(maritacaAdapter.validateKey('test-key')).rejects.toThrow(
        'Maritaca AI returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await maritacaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await maritacaAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('maritacaAdapter.type is maritaca', () => {
      expect(maritacaAdapter.type).toBe('maritaca');
    });
  });

  describe('scalewayAdapter', () => {
    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', data: [] }),
      });

      const result = await scalewayAdapter.validateKey('scw-test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls Scaleway models endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', data: [] }),
      });

      await scalewayAdapter.validateKey('scw-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.scaleway.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer scw-test-key',
          }),
        })
      );
    });

    it('validateKey throws on 401 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(scalewayAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Scaleway API key'
      );
    });

    it('validateKey throws on 403 with descriptive message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(scalewayAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Scaleway API key'
      );
    });

    it('validateKey throws with message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(scalewayAdapter.validateKey('scw-test-key')).rejects.toThrow(
        'Bad request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(scalewayAdapter.validateKey('scw-test-key')).rejects.toThrow(
        'Scaleway returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await scalewayAdapter.fetchUsage('scw-test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await scalewayAdapter.fetchUsage('scw-test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('scalewayAdapter.type is scaleway', () => {
      expect(scalewayAdapter.type).toBe('scaleway');
    });
  });

  describe('nscaleAdapter', () => {
    beforeEach(() => {
      fetchMock.mockReset();
    });

    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ object: 'list', data: [] }),
      });

      const result = await nscaleAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ object: 'list', data: [] }),
      });

      await nscaleAdapter.validateKey('nsc-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://inference.nscale.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer nsc-test-key' }),
        })
      );
    });

    it('validateKey throws with message on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(nscaleAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Nscale API key'
      );
    });

    it('validateKey throws with message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(nscaleAdapter.validateKey('test-key')).rejects.toThrow(
        'Bad request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(nscaleAdapter.validateKey('test-key')).rejects.toThrow(
        'Nscale returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await nscaleAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await nscaleAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('nscaleAdapter.type is nscale', () => {
      expect(nscaleAdapter.type).toBe('nscale');
    });
  });

  describe('aimlapiAdapter', () => {
    it('validateKey returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ object: 'list', data: [] }),
      });

      const result = await aimlapiAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('validateKey calls correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ object: 'list', data: [] }),
      });

      await aimlapiAdapter.validateKey('aimlapi-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.aimlapi.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer aimlapi-test-key' }),
        })
      );
    });

    it('validateKey throws with message on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(aimlapiAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid AI/ML API key'
      );
    });

    it('validateKey throws with message on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(aimlapiAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid AI/ML API key'
      );
    });

    it('validateKey throws with message on API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(aimlapiAdapter.validateKey('test-key')).rejects.toThrow(
        'Bad request'
      );
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(aimlapiAdapter.validateKey('test-key')).rejects.toThrow(
        'AI/ML API returned 503'
      );
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await aimlapiAdapter.fetchUsage('test-key', new Date('2024-01-01'), new Date('2024-01-07'));
      expect(records).toEqual([]);
    });

    it('aimlapiAdapter.type is aimlapi', () => {
      expect(aimlapiAdapter.type).toBe('aimlapi');
    });
  });

  describe('bedrockAdapter', () => {
    beforeEach(() => {
      fetchMock.mockReset();
    });

    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ modelSummaries: [] }),
      });

      const result = await bedrockAdapter.validateKey(
        'us-east-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      );
      expect(result).toBe(true);
    });

    it('validateKey calls correct endpoint for the given region', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ modelSummaries: [] }),
      });

      await bedrockAdapter.validateKey(
        'eu-west-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://bedrock.eu-west-1.amazonaws.com/foundation-models',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('AWS4-HMAC-SHA256'),
          }),
        })
      );
    });

    it('validateKey includes x-amz-date header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ modelSummaries: [] }),
      });

      await bedrockAdapter.validateKey(
        'us-east-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
      );

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-amz-date': expect.stringMatching(/^\d{8}T\d{6}Z$/),
          }),
        })
      );
    });

    it('validateKey throws on 403 invalid credentials', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Access denied' }),
      });

      await expect(
        bedrockAdapter.validateKey('us-east-1::BADKEY::BADSECRET')
      ).rejects.toThrow('Access denied');
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(
        bedrockAdapter.validateKey('us-east-1::BADKEY::BADSECRET')
      ).rejects.toThrow('AWS authentication failed');
    });

    it('validateKey throws on 404 (region not available)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(
        bedrockAdapter.validateKey('ap-southeast-99::AKID::SECRET')
      ).rejects.toThrow('not available in region');
    });

    it('validateKey throws with status code on unknown errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(
        bedrockAdapter.validateKey('us-east-1::AKID::SECRET')
      ).rejects.toThrow('AWS Bedrock returned 503');
    });

    it('fetchUsage returns empty array (no usage API)', async () => {
      const records = await bedrockAdapter.fetchUsage(
        'us-east-1::AKID::SECRET',
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch (no usage API endpoint)', async () => {
      await bedrockAdapter.fetchUsage(
        'us-east-1::AKID::SECRET',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('bedrockAdapter.type is bedrock', () => {
      expect(bedrockAdapter.type).toBe('bedrock');
    });

    describe('parseBedrockCredentials', () => {
      it('parses valid credentials', () => {
        const result = parseBedrockCredentials(
          'us-east-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        );
        expect(result).toEqual({
          region: 'us-east-1',
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        });
      });

      it('throws if only 2 parts', () => {
        expect(() => parseBedrockCredentials('us-east-1::AKID')).toThrow(
          'must be in the format'
        );
      });

      it('throws if region is empty', () => {
        expect(() => parseBedrockCredentials('::AKID::SECRET')).toThrow('region is missing');
      });

      it('throws if accessKeyId is empty', () => {
        expect(() => parseBedrockCredentials('us-east-1::::SECRET')).toThrow('Access Key ID is missing');
      });
    });
  });

  describe('alephAlphaAdapter', () => {
    beforeEach(() => {
      fetchMock.mockReset();
    });

    it('validateKey returns true on 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'user123', email: 'user@example.com' }),
      });

      const result = await alephAlphaAdapter.validateKey('test-token');
      expect(result).toBe(true);
    });

    it('validateKey calls correct endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await alephAlphaAdapter.validateKey('my-aleph-token');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.aleph-alpha.com/users/me',
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-aleph-token' },
        })
      );
    });

    it('validateKey throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      await expect(alephAlphaAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid Aleph Alpha API key'
      );
    });

    it('validateKey throws on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(alephAlphaAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid Aleph Alpha API key'
      );
    });

    it('validateKey throws on other errors with server message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      });

      await expect(alephAlphaAdapter.validateKey('token')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await alephAlphaAdapter.fetchUsage(
        'test-token',
        new Date('2026-05-01'),
        new Date('2026-05-21')
      );
      expect(records).toEqual([]);
    });

    it('alephAlphaAdapter.type is alephalpha', () => {
      expect(alephAlphaAdapter.type).toBe('alephalpha');
    });
  });

  describe('sarvamAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await sarvamAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await sarvamAdapter.validateKey('sarvam-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.sarvam.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer sarvam-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(sarvamAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Sarvam AI API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(sarvamAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Sarvam AI API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

      await expect(sarvamAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await sarvamAdapter.fetchUsage(
        'key',
        new Date('2026-05-01'),
        new Date('2026-05-21')
      );
      expect(records).toEqual([]);
    });

    it('sarvamAdapter.type is sarvam', () => {
      expect(sarvamAdapter.type).toBe('sarvam');
    });
  });

  describe('chutesAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await chutesAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await chutesAdapter.validateKey('chutes-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://llm.chutes.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer chutes-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(chutesAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Chutes AI API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(chutesAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Chutes AI API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

      await expect(chutesAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await chutesAdapter.fetchUsage(
        'key',
        new Date('2026-05-01'),
        new Date('2026-05-21')
      );
      expect(records).toEqual([]);
    });

    it('chutesAdapter.type is chutes', () => {
      expect(chutesAdapter.type).toBe('chutes');
    });
  });

  describe('krutrimAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await krutrimAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await krutrimAdapter.validateKey('krutrim-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://cloud.olakrutrim.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer krutrim-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(krutrimAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Krutrim API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(krutrimAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Krutrim API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

      await expect(krutrimAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await krutrimAdapter.fetchUsage(
        'key',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('krutrimAdapter.type is krutrim', () => {
      expect(krutrimAdapter.type).toBe('krutrim');
    });
  });

  describe('ovhcloudAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await ovhcloudAdapter.validateKey('test-token');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await ovhcloudAdapter.validateKey('ovh-test-token');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer ovh-test-token' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(ovhcloudAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid OVHcloud AI token'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(ovhcloudAdapter.validateKey('bad-token')).rejects.toThrow(
        'Invalid OVHcloud AI token'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

      await expect(ovhcloudAdapter.validateKey('test-token')).rejects.toThrow(
        'Internal error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await ovhcloudAdapter.fetchUsage(
        'token',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('ovhcloudAdapter.type is ovhcloud', () => {
      expect(ovhcloudAdapter.type).toBe('ovhcloud');
    });
  });

  describe('telnyxAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await telnyxAdapter.validateKey('KEY_test-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await telnyxAdapter.validateKey('KEY_telnyx-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.telnyx.com/v2/ai/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer KEY_telnyx-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(telnyxAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Telnyx API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(telnyxAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Telnyx API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ errors: [{ detail: 'Internal server error' }] }),
      });

      await expect(telnyxAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await telnyxAdapter.fetchUsage(
        'KEY_token',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('telnyxAdapter.type is telnyx', () => {
      expect(telnyxAdapter.type).toBe('telnyx');
    });
  });

  describe('vultrAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await vultrAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await vultrAdapter.validateKey('vultr-test-api-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.vultrinference.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer vultr-test-api-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(vultrAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Vultr API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(vultrAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Vultr API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(vultrAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await vultrAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('vultrAdapter.type is vultr', () => {
      expect(vultrAdapter.type).toBe('vultr');
    });
  });

  describe('ai71Adapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await ai71Adapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await ai71Adapter.validateKey('api71-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.ai71.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer api71-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(ai71Adapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid AI71 API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(ai71Adapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid AI71 API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(ai71Adapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await ai71Adapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('ai71Adapter.type is ai71', () => {
      expect(ai71Adapter.type).toBe('ai71');
    });
  });

  describe('gcoreAdapter', () => {
    it('returns true for valid key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      const result = await gcoreAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('calls the correct endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

      await gcoreAdapter.validateKey('gcore-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://inference.gcore.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer gcore-test-key' }),
        })
      );
    });

    it('throws descriptive error on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(gcoreAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Gcore API key'
      );
    });

    it('throws descriptive error on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(gcoreAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Gcore API key'
      );
    });

    it('throws provider error with message on other status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal server error' } }),
      });

      await expect(gcoreAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await gcoreAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-22')
      );
      expect(records).toEqual([]);
    });

    it('gcoreAdapter.type is gcore', () => {
      expect(gcoreAdapter.type).toBe('gcore');
    });
  });

  describe('crusoeAdapter', () => {
    it('returns true for a valid API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await crusoeAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('sends Bearer token to the Crusoe models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await crusoeAdapter.validateKey('crusoe-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.crusoe.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer crusoe-test-key' }),
        })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(crusoeAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Crusoe API key'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(crusoeAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Crusoe API key'
      );
    });

    it('throws the provider error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });
      await expect(crusoeAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await crusoeAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('crusoeAdapter.type is crusoe', () => {
      expect(crusoeAdapter.type).toBe('crusoe');
    });
  });

  describe('databricksAdapter', () => {
    it('returns true for a valid API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ serving_endpoints: [] }) });
      const result = await databricksAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('sends Bearer token to the Databricks serving-endpoints endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await databricksAdapter.validateKey('dapi_test_key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.databricks.com/api/2.0/serving-endpoints',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer dapi_test_key' }),
        })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(databricksAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Databricks API key'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(databricksAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Databricks API key'
      );
    });

    it('throws the provider error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });
      await expect(databricksAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await databricksAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('databricksAdapter.type is databricks', () => {
      expect(databricksAdapter.type).toBe('databricks');
    });
  });

  describe('gradientAdapter', () => {
    it('returns true for a valid API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await gradientAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('sends Bearer token to the Gradient AI models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await gradientAdapter.validateKey('gradient-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.gradient.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer gradient-test-key' }),
        })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(gradientAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Gradient AI API key'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(gradientAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Gradient AI API key'
      );
    });

    it('throws the provider error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });
      await expect(gradientAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await gradientAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('gradientAdapter.type is gradient', () => {
      expect(gradientAdapter.type).toBe('gradient');
    });
  });

  describe('basetenAdapter', () => {
    it('returns true for a valid API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await basetenAdapter.validateKey('test-api-key');
      expect(result).toBe(true);
    });

    it('sends Bearer token to the Baseten models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await basetenAdapter.validateKey('baseten-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.baseten.co/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer baseten-test-key' }),
        })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(basetenAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Baseten API key'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(basetenAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Baseten API key'
      );
    });

    it('throws the provider error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });
      await expect(basetenAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await basetenAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('basetenAdapter.type is baseten', () => {
      expect(basetenAdapter.type).toBe('baseten');
    });
  });

  describe('watsonxAdapter', () => {
    it('returns true for valid credentials after IAM token exchange', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'eyJhbGciOiJSUzI1NiJ9.test', token_type: 'Bearer' }),
      });
      const result = await watsonxAdapter.validateKey('ibm-api-key-12345::project-id-12345');
      expect(result).toBe(true);
    });

    it('sends API key to IBM IAM token endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-token' }),
      });
      await watsonxAdapter.validateKey('my-ibm-api-key::my-project-id');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://iam.cloud.ibm.com/identity/token',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws a friendly error for 401 IAM responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(watsonxAdapter.validateKey('bad-key::project-id')).rejects.toThrow(
        'Invalid IBM Cloud API key'
      );
    });

    it('throws a friendly error for 400 IAM responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ errorMessage: 'BXNIM0415E' }),
      });
      await expect(watsonxAdapter.validateKey('bad-key::project-id')).rejects.toThrow(
        'Invalid IBM Cloud API key'
      );
    });

    it('throws if credentials are missing ::', async () => {
      await expect(watsonxAdapter.validateKey('just-an-api-key')).rejects.toThrow(
        'WatsonX credentials must be in the format'
      );
    });

    it('throws if access_token is missing from IAM response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'no token' }),
      });
      await expect(watsonxAdapter.validateKey('api-key::project-id')).rejects.toThrow(
        'IBM IAM did not return an access token'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await watsonxAdapter.fetchUsage(
        'api-key::project-id',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('watsonxAdapter.type is watsonx', () => {
      expect(watsonxAdapter.type).toBe('watsonx');
    });
  });

  describe('parseWatsonXCredentials', () => {
    it('parses valid apiKey::projectId', () => {
      const result = parseWatsonXCredentials('my-api-key::my-project-id');
      expect(result).toEqual({ apiKey: 'my-api-key', projectId: 'my-project-id' });
    });

    it('trims whitespace from both parts', () => {
      const result = parseWatsonXCredentials('  api-key  ::  project-id  ');
      expect(result).toEqual({ apiKey: 'api-key', projectId: 'project-id' });
    });

    it('throws if :: separator is missing', () => {
      expect(() => parseWatsonXCredentials('no-separator')).toThrow(
        'WatsonX credentials must be in the format'
      );
    });

    it('throws if projectId is empty', () => {
      expect(() => parseWatsonXCredentials('api-key::')).toThrow(
        'WatsonX project ID is missing'
      );
    });

    it('throws if apiKey is empty', () => {
      expect(() => parseWatsonXCredentials('::project-id')).toThrow(
        'IBM Cloud API key is missing'
      );
    });
  });

  describe('snowflakeAdapter', () => {
    it('returns true for valid credentials (200 ok)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'hi' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }),
      });
      const result = await snowflakeAdapter.validateKey('myorg-myaccount.us-east-1::eyJhbGciOiJSUzI1NiJ9.test');
      expect(result).toBe(true);
    });

    it('sends POST to Snowflake Cortex inference endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });
      await snowflakeAdapter.validateKey('myaccount.us-west-2::my-token');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://myaccount.us-west-2.snowflakecomputing.com/api/v2/cortex/inference:complete',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(snowflakeAdapter.validateKey('myaccount.us-east-1::bad-token')).rejects.toThrow(
        'Invalid Snowflake credentials'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(snowflakeAdapter.validateKey('myaccount.us-east-1::expired-token')).rejects.toThrow(
        'Invalid Snowflake credentials'
      );
    });

    it('throws if credentials are missing ::', async () => {
      await expect(snowflakeAdapter.validateKey('just-a-token')).rejects.toThrow(
        'Snowflake credentials must be in the format'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await snowflakeAdapter.fetchUsage(
        'myaccount.us-east-1::my-token',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('snowflakeAdapter.type is snowflake', () => {
      expect(snowflakeAdapter.type).toBe('snowflake');
    });
  });

  describe('parseSnowflakeCredentials', () => {
    it('parses valid account::token', () => {
      const result = parseSnowflakeCredentials('myorg-myaccount.us-east-1::eyJhbGci.token');
      expect(result).toEqual({ account: 'myorg-myaccount.us-east-1', token: 'eyJhbGci.token' });
    });

    it('trims whitespace from both parts', () => {
      const result = parseSnowflakeCredentials('  myaccount  ::  my-token  ');
      expect(result).toEqual({ account: 'myaccount', token: 'my-token' });
    });

    it('throws if :: separator is missing', () => {
      expect(() => parseSnowflakeCredentials('no-separator')).toThrow(
        'Snowflake credentials must be in the format'
      );
    });

    it('throws if token is empty', () => {
      expect(() => parseSnowflakeCredentials('myaccount::')).toThrow(
        'Snowflake token is missing after ::'
      );
    });

    it('throws if account is empty', () => {
      expect(() => parseSnowflakeCredentials('::my-token')).toThrow(
        'Snowflake account identifier is missing before ::'
      );
    });
  });

  describe('neetsAdapter', () => {
    it('returns true for valid API key', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
      const result = await neetsAdapter.validateKey('neets-test-api-key');
      expect(result).toBe(true);
    });

    it('sends Bearer token to the Neets.ai models endpoint', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      await neetsAdapter.validateKey('neets-test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.neets.ai/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer neets-test-key' }),
        })
      );
    });

    it('throws a friendly error for 401 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(neetsAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Neets.ai API key'
      );
    });

    it('throws a friendly error for 403 responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(neetsAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid Neets.ai API key'
      );
    });

    it('throws the provider error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });
      await expect(neetsAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await neetsAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('neetsAdapter.type is neets', () => {
      expect(neetsAdapter.type).toBe('neets');
    });
  });

  describe('runpodAdapter', () => {
    it('returns true for valid API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { myself: { id: 'user_abc123' } } }),
      });
      const result = await runpodAdapter.validateKey('runpod-test-api-key');
      expect(result).toBe(true);
    });

    it('sends request to the RunPod GraphQL endpoint with api_key query param', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { myself: { id: 'user_123' } } }),
      });
      await runpodAdapter.validateKey('my-runpod-key');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('api.runpod.io/graphql'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('throws a friendly error for auth errors in GraphQL response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'Not authorized' }] }),
      });
      await expect(runpodAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid RunPod API key'
      );
    });

    it('throws a friendly error when GraphQL returns unauthorized message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'unauthorized access' }] }),
      });
      await expect(runpodAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid RunPod API key'
      );
    });

    it('throws the GraphQL error message for non-auth errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: 'Internal server error' }] }),
      });
      await expect(runpodAdapter.validateKey('test-key')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('throws on HTTP-level errors', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(runpodAdapter.validateKey('test-key')).rejects.toThrow(
        'RunPod API returned 502'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await runpodAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-23')
      );
      expect(records).toEqual([]);
    });

    it('runpodAdapter.type is runpod', () => {
      expect(runpodAdapter.type).toBe('runpod');
    });
  });

  describe('predibaseAdapter', () => {
    it('returns true for valid API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await predibaseAdapter.validateKey('predibase-test-api-key');
      expect(result).toBe(true);
    });

    it('sends GET request to the Predibase /v1/models endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await predibaseAdapter.validateKey('my-predibase-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.predibase.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-predibase-key' }),
        })
      );
    });

    it('throws on HTTP-level errors', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(predibaseAdapter.validateKey('bad-key')).rejects.toThrow(
        'Predibase API returned 401'
      );
    });

    it('throws on 403 HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(predibaseAdapter.validateKey('bad-key')).rejects.toThrow(
        'Predibase API returned 403'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await predibaseAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await predibaseAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('predibaseAdapter.type is predibase', () => {
      expect(predibaseAdapter.type).toBe('predibase');
    });
  });

  describe('vertexaiAdapter', () => {
    const validCreds = 'my-gcp-project::us-central1::ya29.a0AfH6SMCtest';

    it('returns true for valid credentials', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });
      const result = await vertexaiAdapter.validateKey(validCreds);
      expect(result).toBe(true);
    });

    it('sends GET to the correct Vertex AI endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });
      await vertexaiAdapter.validateKey(validCreds);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://us-central1-aiplatform.googleapis.com/v1/projects/my-gcp-project/locations/us-central1/publishers/google/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer ya29.a0AfH6SMCtest' }),
        })
      );
    });

    it('throws on 401 with descriptive message about token refresh', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(vertexaiAdapter.validateKey(validCreds)).rejects.toThrow(
        /expired/i
      );
    });

    it('throws on 403 with descriptive message about permissions', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(vertexaiAdapter.validateKey(validCreds)).rejects.toThrow(
        /Access denied/i
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await vertexaiAdapter.fetchUsage(
        validCreds,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await vertexaiAdapter.fetchUsage(
        validCreds,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('vertexaiAdapter.type is vertexai', () => {
      expect(vertexaiAdapter.type).toBe('vertexai');
    });

    describe('parseVertexAICredentials', () => {
      it('parses valid credentials correctly', () => {
        const result = parseVertexAICredentials('proj::us-central1::ya29.token');
        expect(result).toEqual({ projectId: 'proj', location: 'us-central1', accessToken: 'ya29.token' });
      });

      it('throws on missing location', () => {
        expect(() => parseVertexAICredentials('proj::ya29.token')).toThrow();
      });

      it('throws on missing access token', () => {
        expect(() => parseVertexAICredentials('proj::us-central1::')).toThrow();
      });
    });
  });

  describe('sparkAdapter', () => {
    it('returns true for valid API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await sparkAdapter.validateKey('spark-test-api-key');
      expect(result).toBe(true);
    });

    it('sends GET request to the iFlyTek Spark /v1/models endpoint with Bearer auth', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await sparkAdapter.validateKey('my-spark-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://spark-api-open.xf-yun.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-spark-key' }),
        })
      );
    });

    it('throws on HTTP-level errors', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(sparkAdapter.validateKey('bad-key')).rejects.toThrow(
        'iFlyTek Spark API returned 401'
      );
    });

    it('throws on 403 HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(sparkAdapter.validateKey('bad-key')).rejects.toThrow(
        'iFlyTek Spark API returned 403'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await sparkAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await sparkAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sparkAdapter.type is spark', () => {
      expect(sparkAdapter.type).toBe('spark');
    });
  });

  describe('ionetAdapter', () => {
    it('validateKey calls io.net API with correct headers', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      await ionetAdapter.validateKey('test-key');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.io.net/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        })
      );
    });

    it('returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const result = await ionetAdapter.validateKey('test-key');
      expect(result).toBe(true);
    });

    it('throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(ionetAdapter.validateKey('bad-key')).rejects.toThrow(
        'Invalid io.net API key. Get your key from cloud.io.net.'
      );
    });

    it('throws on non-401 HTTP errors with body message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal Server Error' } }),
      });
      await expect(ionetAdapter.validateKey('bad-key')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await ionetAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await ionetAdapter.fetchUsage(
        'test-api-key',
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ionetAdapter.type is ionet', () => {
      expect(ionetAdapter.type).toBe('ionet');
    });
  });

  describe('ociAdapter', () => {
    const validCreds = 'ocid1.compartment.oc1..aaaaaa::eyJhbGciOiJSUzI1NiJ9.test';

    it('validateKey posts to OCI inference endpoint with correct headers', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      await ociAdapter.validateKey(validCreds);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.test' }),
        })
      );
    });

    it('returns true on success', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      const result = await ociAdapter.validateKey(validCreds);
      expect(result).toBe(true);
    });

    it('throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(ociAdapter.validateKey(validCreds)).rejects.toThrow(
        'Invalid OCI credentials'
      );
    });

    it('throws on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(ociAdapter.validateKey(validCreds)).rejects.toThrow(
        'Invalid OCI credentials'
      );
    });

    it('throws on non-401 HTTP errors with body message', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(ociAdapter.validateKey(validCreds)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await ociAdapter.fetchUsage(
        validCreds,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await ociAdapter.fetchUsage(
        validCreds,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ociAdapter.type is oci', () => {
      expect(ociAdapter.type).toBe('oci');
    });
  });

  describe('parseOCICredentials', () => {
    it('parses valid compartmentId::token format', () => {
      const result = parseOCICredentials('ocid1.compartment.oc1..aaa::eyJhbGci');
      expect(result).toEqual({
        compartmentId: 'ocid1.compartment.oc1..aaa',
        authToken: 'eyJhbGci',
      });
    });

    it('throws if :: separator is missing', () => {
      expect(() => parseOCICredentials('just-a-token')).toThrow(
        'OCI credentials must be in the format'
      );
    });

    it('throws if compartmentId is empty', () => {
      expect(() => parseOCICredentials('::token')).toThrow(
        'compartmentId is missing'
      );
    });

    it('throws if authToken is empty', () => {
      expect(() => parseOCICredentials('ocid1.compartment.oc1..aaa::')).toThrow(
        'authToken is missing'
      );
    });

    it('handles tokens that contain :: (takes first occurrence)', () => {
      const result = parseOCICredentials('ocid1.comp.oc1..aaa::token::extra');
      expect(result.compartmentId).toBe('ocid1.comp.oc1..aaa');
      expect(result.authToken).toBe('token::extra');
    });
  });

  describe('gigachatAdapter', () => {
    const validKey = 'OGYzNDI4ZWEtM2IxNi00YWU1LTliNWUtZTY0MzljMjRiY2Vh';

    it('validateKey posts to Sberbank OAuth endpoint with correct headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'eyJ.test.token' }),
      });
      await gigachatAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Basic ${validKey}`,
          }),
        })
      );
    });

    it('returns true when OAuth returns access_token', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'eyJ.test.token' }),
      });
      const result = await gigachatAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(gigachatAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid GigaChat Authorization Key'
      );
    });

    it('throws on 403', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });
      await expect(gigachatAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid GigaChat Authorization Key'
      );
    });

    it('throws when access_token is missing in 200 response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await expect(gigachatAdapter.validateKey(validKey)).rejects.toThrow(
        'did not return an access token'
      );
    });

    it('throws on non-401 HTTP errors with error_description', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error_description: 'Internal Server Error' }),
      });
      await expect(gigachatAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await gigachatAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await gigachatAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('gigachatAdapter.type is gigachat', () => {
      expect(gigachatAdapter.type).toBe('gigachat');
    });
  });

  describe('githubAdapter', () => {
    const validKey = 'github_pat_11AABCDEF_validtokenstring1234567890';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await githubAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://models.inference.ai.azure.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await githubAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about GitHub PAT', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(githubAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid GitHub Personal Access Token'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(githubAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await githubAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await githubAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('githubAdapter.type is github', () => {
      expect(githubAdapter.type).toBe('github');
    });
  });

  describe('parasailAdapter', () => {
    const validKey = 'ps-validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await parasailAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.parasail.io/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await parasailAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Parasail API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(parasailAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Parasail API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(parasailAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await parasailAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await parasailAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-24')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('parasailAdapter.type is parasail', () => {
      expect(parasailAdapter.type).toBe('parasail');
    });
  });

  describe('openpipeAdapter', () => {
    const validKey = 'opk_validapikey1234567890abcdef';

    it('validateKey calls GET /api/v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await openpipeAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.openpipe.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /api/v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await openpipeAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about OpenPipe API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(openpipeAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid OpenPipe API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(openpipeAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await openpipeAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await openpipeAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('openpipeAdapter.type is openpipe', () => {
      expect(openpipeAdapter.type).toBe('openpipe');
    });
  });

  describe('corcelAdapter', () => {
    const validKey = 'corcel_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await corcelAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.corcel.io/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await corcelAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Corcel API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(corcelAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Corcel API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(corcelAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await corcelAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await corcelAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('corcelAdapter.type is corcel', () => {
      expect(corcelAdapter.type).toBe('corcel');
    });
  });

  describe('inceptionAdapter', () => {
    const validKey = 'inception_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await inceptionAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.inceptionlabs.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await inceptionAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Inception AI API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(inceptionAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Inception AI API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(inceptionAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await inceptionAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await inceptionAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('inceptionAdapter.type is inception', () => {
      expect(inceptionAdapter.type).toBe('inception');
    });
  });

  describe('liquidAdapter', () => {
    const validKey = 'liquid_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await liquidAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.liquid.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await liquidAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Liquid AI API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(liquidAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Liquid AI API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(liquidAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await liquidAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await liquidAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('liquidAdapter.type is liquid', () => {
      expect(liquidAdapter.type).toBe('liquid');
    });
  });

  describe('zyphraAdapter', () => {
    const validKey = 'zyphra_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await zyphraAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.zyphra.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await zyphraAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Zyphra API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(zyphraAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Zyphra API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(zyphraAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await zyphraAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await zyphraAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('zyphraAdapter.type is zyphra', () => {
      expect(zyphraAdapter.type).toBe('zyphra');
    });
  });

  describe('akashAdapter', () => {
    const validKey = 'akash_validapikey1234567890abcdef';

    it('validateKey calls GET /api/v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await akashAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://chatapi.akash.network/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /api/v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await akashAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Akash API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(akashAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Akash API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(akashAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await akashAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await akashAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('akashAdapter.type is akash', () => {
      expect(akashAdapter.type).toBe('akash');
    });
  });

  describe('arceeAdapter', () => {
    const validKey = 'arcee_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await arceeAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.arcee.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await arceeAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Arcee API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(arceeAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Arcee AI API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(arceeAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await arceeAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await arceeAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('arceeAdapter.type is arcee', () => {
      expect(arceeAdapter.type).toBe('arcee');
    });
  });

  describe('centmlAdapter', () => {
    const validKey = 'centml_validapikey1234567890abcdef';

    it('validateKey calls GET /openai/v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await centmlAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.centml.com/openai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /openai/v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await centmlAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about CentML API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(centmlAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid CentML API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(centmlAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await centmlAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await centmlAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-25')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('centmlAdapter.type is centml', () => {
      expect(centmlAdapter.type).toBe('centml');
    });
  });

  describe('veniceAdapter', () => {
    const validKey = 'venice_validapikey1234567890abcdef';

    it('validateKey calls GET /api/v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await veniceAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.venice.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /api/v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await veniceAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Venice AI API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(veniceAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Venice AI API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(veniceAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await veniceAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await veniceAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('veniceAdapter.type is venice', () => {
      expect(veniceAdapter.type).toBe('venice');
    });
  });

  describe('inferlessAdapter', () => {
    const validKey = 'inferless_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await inferlessAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.inferless.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await inferlessAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Inferless API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(inferlessAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Inferless API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(inferlessAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await inferlessAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await inferlessAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('inferlessAdapter.type is inferless', () => {
      expect(inferlessAdapter.type).toBe('inferless');
    });
  });

  describe('codestralAdapter', () => {
    const validKey = 'codestral_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await codestralAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://codestral.mistral.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await codestralAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Codestral API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(codestralAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Codestral API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(codestralAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await codestralAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await codestralAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('codestralAdapter.type is codestral', () => {
      expect(codestralAdapter.type).toBe('codestral');
    });
  });

  describe('monsterapiAdapter', () => {
    const validKey = 'monsterapi_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await monsterapiAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.monsterapi.ai/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await monsterapiAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Monster API key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(monsterapiAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Monster API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(monsterapiAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await monsterapiAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await monsterapiAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('monsterapiAdapter.type is monsterapi', () => {
      expect(monsterapiAdapter.type).toBe('monsterapi');
    });
  });

  describe('fluidstackAdapter', () => {
    const validKey = 'fs_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await fluidstackAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.fluidstack.io/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await fluidstackAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Fluidstack key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(fluidstackAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Fluidstack API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(fluidstackAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await fluidstackAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await fluidstackAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fluidstackAdapter.type is fluidstack', () => {
      expect(fluidstackAdapter.type).toBe('fluidstack');
    });
  });

  describe('coreweaveAdapter', () => {
    const validKey = 'cw_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await coreweaveAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://inference.coreweave.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await coreweaveAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about CoreWeave key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(coreweaveAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid CoreWeave API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(coreweaveAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await coreweaveAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await coreweaveAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('coreweaveAdapter.type is coreweave', () => {
      expect(coreweaveAdapter.type).toBe('coreweave');
    });
  });

  describe('premAdapter', () => {
    const validKey = 'prem_validapikey1234567890abcdef';

    it('validateKey calls GET /v1/models with Bearer token header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      await premAdapter.validateKey(validKey);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.premai.io/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${validKey}`,
          }),
        })
      );
    });

    it('returns true when GET /v1/models returns ok', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
      const result = await premAdapter.validateKey(validKey);
      expect(result).toBe(true);
    });

    it('throws on 401 with helpful message about Prem AI key', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });
      await expect(premAdapter.validateKey(validKey)).rejects.toThrow(
        'Invalid Prem AI API key'
      );
    });

    it('throws on non-401 errors with error message from body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });
      await expect(premAdapter.validateKey(validKey)).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('fetchUsage returns empty array', async () => {
      const records = await premAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(records).toEqual([]);
    });

    it('fetchUsage does not call fetch', async () => {
      fetchMock.mockReset();
      await premAdapter.fetchUsage(
        validKey,
        new Date('2026-05-01'),
        new Date('2026-05-26')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('premAdapter.type is prem', () => {
      expect(premAdapter.type).toBe('prem');
    });
  });
});
