import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NVIDIA NIM adapter.
 * Validates API key via GET /v1/models (OpenAI-compatible endpoint).
 * NVIDIA NIM does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNvidia) to capture per-call costs instead.
 *
 * API docs: https://docs.api.nvidia.com/nim/reference/
 */
export const nvidiaAdapter: ProviderAdapter = {
  type: 'nvidia',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Invalid NVIDIA API key. Get your key from build.nvidia.com.'
        );
      }
      throw new Error(
        body?.detail ?? body?.message ?? `NVIDIA API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NVIDIA NIM does not provide a public usage/billing API.
    // Use wrapNvidia() SDK wrapper for per-call cost tracking.
    return [];
  },
};
