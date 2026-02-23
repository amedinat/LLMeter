import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiAdapter } from './openai-adapter';
import { anthropicAdapter } from './anthropic-adapter';
import { googleAdapter } from './google-adapter';
import { deepseekAdapter } from './deepseek-adapter';

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

    it('fetchUsage parses Anthropic response correctly', async () => {
      const mockResponse = {
        data: [
          {
            date: '2024-01-01',
            model: 'claude-3-opus-20240229',
            input_tokens: 1000,
            output_tokens: 500,
            num_requests: 5,
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-01T23:59:59Z');

      const records = await anthropicAdapter.fetchUsage('sk-ant-test', startDate, endDate);

      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(
        expect.objectContaining({
          date: '2024-01-01',
          model: 'claude-3-opus-20240229',
          inputTokens: 1000,
          outputTokens: 500,
          requests: 5,
        })
      );
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
});
