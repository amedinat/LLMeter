import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * OpenAI Usage API adapter.
 * Uses the /v1/organization/usage/completions endpoint (admin key required).
 */
export const openaiAdapter: ProviderAdapter = {
  type: 'openai',

  async validateKey(apiKey: string): Promise<boolean> {
    if (apiKey.startsWith('sk-ant-')) {
      throw new Error(
        'This looks like an Anthropic key, not an OpenAI key. ' +
        'OpenAI keys start with sk-admin- (admin keys) or sk-proj- (project keys).'
      );
    }

    // Admin keys (sk-admin-*) cannot call /v1/models but CAN call usage endpoints.
    // Project keys (sk-proj-*) can call /v1/models but may NOT have usage access.
    // We validate based on the key type.
    const isAdminKey = apiKey.startsWith('sk-admin-');

    if (!isAdminKey) {
      // For non-admin keys, first check basic validity via /v1/models
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.error?.message ?? `OpenAI API returned ${res.status}`
        );
      }
    }

    // Check if the key has usage/admin permissions (required for cost tracking)
    const usageRes = await fetch(
      'https://api.openai.com/v1/organization/usage/completions?start_time=' +
        Math.floor(Date.now() / 1000 - 86400) +
        '&end_time=' +
        Math.floor(Date.now() / 1000) +
        '&bucket_width=1d',
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!usageRes.ok) {
      const status = usageRes.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'This API key does not have admin/usage permissions. ' +
          'LLMeter requires an Admin API key (sk-admin-...) to fetch usage data. ' +
          'Go to platform.openai.com → Organization → Admin Keys to create one.'
        );
      }
      const body = await usageRes.json().catch(() => ({}));
      throw new Error(
        body?.error?.message ?? `OpenAI usage API returned ${status}`
      );
    }

    return true;
  },

  async fetchUsage(
    apiKey: string,
    startDate: Date,
    endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // OpenAI usage endpoint uses unix timestamps
    const startTs = Math.floor(startDate.getTime() / 1000);
    const endTs = Math.floor(endDate.getTime() / 1000);

    const url = new URL('https://api.openai.com/v1/organization/usage/completions');
    url.searchParams.set('start_time', startTs.toString());
    url.searchParams.set('end_time', endTs.toString());
    url.searchParams.set('bucket_width', '1d');
    url.searchParams.set('group_by', 'model');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const status = res.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Usage API access denied. This key may not have admin permissions. ' +
          'Go to platform.openai.com → Organization → Admin Keys.'
        );
      }
      throw new Error(
        body?.error?.message ?? `OpenAI usage API returned ${res.status}`
      );
    }

    const data = await res.json();
    const records: NormalizedUsageRecord[] = [];

    // Parse OpenAI bucket format
    for (const bucket of data.data ?? []) {
      const date = new Date(bucket.start_time * 1000)
        .toISOString()
        .slice(0, 10);

      for (const result of bucket.results ?? []) {
        const inputTokens = result.input_tokens ?? 0;
        const outputTokens = result.output_tokens ?? 0;
        const numRequests = result.num_model_requests ?? 0;

        // Estimate cost from token counts using centralized pricing
        const costUsd = estimateOpenAICost(
          result.model ?? 'unknown',
          inputTokens,
          outputTokens
        );

        records.push({
          date,
          model: result.model ?? 'unknown',
          inputTokens,
          outputTokens,
          requests: numRequests,
          costUsd,
          rawData: result,
        });
      }
    }

    return records;
  },
};

/**
 * Cost estimation for OpenAI models using centralized pricing.
 */
function estimateOpenAICost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(model);

  if (pricing) {
    return (
      (inputTokens / 1_000_000) * pricing.input_price_per_1m_tokens +
      (outputTokens / 1_000_000) * pricing.output_price_per_1m_tokens
    );
  }

  // Fallback to default provider rates
  const [defaultInput, defaultOutput] = getDefaultRates('openai');
  
  return (
    (inputTokens / 1_000_000) * defaultInput +
    (outputTokens / 1_000_000) * defaultOutput
  );
}
