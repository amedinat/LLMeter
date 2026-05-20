import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Maritaca AI adapter.
 * Validates API key via POST /chat/inference (a lightweight probe call).
 * Maritaca AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapMaritaca) to capture per-call costs instead.
 *
 * API docs: https://docs.maritaca.ai/
 */
export const maritacaAdapter: ProviderAdapter = {
  type: 'maritaca',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://chat.maritaca.ai/api/chat/inference', {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sabia-3',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Maritaca AI key. Get your key from plataforma.maritaca.ai.'
        );
      }
      throw new Error(
        body?.message ?? body?.error ?? `Maritaca AI returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Maritaca AI does not provide a public usage/billing API.
    // Use wrapMaritaca() SDK wrapper for per-call cost tracking.
    return [];
  },
};
