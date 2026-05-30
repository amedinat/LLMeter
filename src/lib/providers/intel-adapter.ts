import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Intel Developer Cloud adapter (Intel Tiber AI Cloud / Gaudi AI accelerators).
 * Intel Corporation (NASDAQ: INTC), Santa Clara CA, founded 1968 by Gordon Moore and Robert Noyce.
 * 113,000 employees, $54B+ annual revenue.
 * Gaudi AI accelerators (Gaudi 2 and Gaudi 3) compete directly with NVIDIA A100/H100
 * and AMD Instinct MI300X. Gaudi 3 launched April 2024: 4× AI compute vs Gaudi 2.
 * 3rd of the "Big 3 AI chip" companies now tracked in LLMeter
 * (after NVIDIA via nvidia adapter and AMD via Lamini Day 122).
 * Intel AI PC initiative: 100M+ AI PCs with Neural Processing Units.
 * OpenAI-compatible API at api.us.gaudi.cloud.intel.com/v1.
 * 5 of 8 models have symmetric pricing.
 * Mistral 7B at $0.05/1M — 98% cheaper than GPT-4o input.
 * Validates API key via GET /v1/models on Intel Gaudi Cloud endpoint.
 * Intel Developer Cloud does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapIntel) to capture per-call costs instead.
 *
 * API docs: https://console.cloud.intel.com
 */
export const intelAdapter: ProviderAdapter = {
  type: 'intel',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error('Intel API key is missing. Get your key from console.cloud.intel.com.');

    const res = await fetch('https://api.us.gaudi.cloud.intel.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Intel API key. Get your key from console.cloud.intel.com.'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Intel API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Intel Developer Cloud does not provide a public usage/billing API.
    // Use wrapIntel() SDK wrapper for per-call cost tracking.
    return [];
  },
};
