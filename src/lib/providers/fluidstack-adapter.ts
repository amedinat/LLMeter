import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Fluidstack adapter.
 * Validates API key via GET /v1/models on Fluidstack's OpenAI-compatible endpoint.
 * Fluidstack does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapFluidStack) to capture per-call costs instead.
 *
 * API docs: https://docs.fluidstack.io
 */
export const fluidstackAdapter: ProviderAdapter = {
  type: 'fluidstack',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Fluidstack API key is missing. Get your key from app.fluidstack.io.'
      );
    }

    const res = await fetch('https://api.fluidstack.io/v1/models', {
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
        'Invalid Fluidstack API key. Get your key from app.fluidstack.io.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Fluidstack returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Fluidstack does not provide a public usage/billing API.
    // Use wrapFluidStack() SDK wrapper for per-call cost tracking.
    return [];
  },
};
