import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Mistral AI Codestral adapter.
 * Validates API key via GET /v1/models on the dedicated Codestral endpoint.
 * Codestral does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapCodestral) to capture per-call costs instead.
 *
 * Codestral is Mistral AI's dedicated code generation endpoint:
 * - Fill-in-the-Middle (FIM) via POST /v1/fim/completions
 * - Devstral for agentic software engineering tasks
 * - Codestral 22B for code completion in 80+ languages
 * - Codestral Mamba 7B for ultra-fast symmetric inference
 *
 * API docs: https://docs.mistral.ai/capabilities/code_generation/
 */
export const codestralAdapter: ProviderAdapter = {
  type: 'codestral',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Codestral API key is missing. Get your key from console.mistral.ai/api-keys.'
      );
    }

    const res = await fetch('https://codestral.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid Codestral API key. Get your key from console.mistral.ai/api-keys.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Codestral returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Codestral does not provide a public usage/billing API.
    // Use wrapCodestral() SDK wrapper for per-call cost tracking.
    return [];
  },
};
