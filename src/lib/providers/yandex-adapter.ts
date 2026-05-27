import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Yandex Cloud Foundation Models adapter.
 * Validates IAM token via GET /foundationModels/v1/listFoundationModels.
 * Yandex Cloud does not expose a per-day billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapYandex) to capture per-call costs instead.
 *
 * Yandex — Russia's #1 internet company, founded 1997, >60% Russian search market
 * share. ~$15B revenue, 20,000+ employees. YandexGPT is their flagship LLM family,
 * built on 27 years of Cyrillic NLP expertise. Second Russian AI provider on LLMeter
 * after GigaChat (Sberbank, Day 75). OpenAI-compatible Foundation Models API.
 *
 * API docs: https://cloud.yandex.com/en/docs/foundation-models
 */
export const yandexAdapter: ProviderAdapter = {
  type: 'yandex',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'Yandex Cloud IAM token is missing. Generate one via: yc iam create-token or the Yandex Cloud Console.'
      );
    }

    const res = await fetch(
      'https://llm.api.cloud.yandex.net/foundationModels/v1/listFoundationModels',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: 'application/json',
        },
      }
    );

    if (res.ok) {
      return true;
    }

    if (res.status === 401) {
      throw new Error(
        'Invalid Yandex Cloud IAM token. Generate a new one via: yc iam create-token or the Yandex Cloud Console.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `Yandex Cloud returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Yandex Cloud does not provide a public per-day usage/billing API.
    // Use wrapYandex() SDK wrapper for per-call cost tracking.
    return [];
  },
};
