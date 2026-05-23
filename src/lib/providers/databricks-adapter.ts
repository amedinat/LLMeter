import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Databricks Foundation Model APIs adapter.
 * Validates API key via GET /api/2.0/serving-endpoints on api.databricks.com.
 * Databricks does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapDatabricks) to capture per-call costs instead.
 *
 * API docs: https://docs.databricks.com/aws/en/machine-learning/foundation-models/
 */
export const databricksAdapter: ProviderAdapter = {
  type: 'databricks',

  async validateKey(apiKey: string): Promise<boolean> {
    const res = await fetch('https://api.databricks.com/api/2.0/serving-endpoints', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Databricks API key. Generate a personal access token from your Databricks workspace settings.'
        );
      }
      throw new Error(
        body?.message ?? body?.error?.message ?? `Databricks returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Databricks does not provide a public usage/billing API for Foundation Model tokens.
    // Use wrapDatabricks() SDK wrapper for per-call cost tracking.
    return [];
  },
};
