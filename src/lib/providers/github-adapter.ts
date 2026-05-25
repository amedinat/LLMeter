import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * GitHub Models adapter.
 *
 * Credentials format: a GitHub Personal Access Token (classic or fine-grained).
 *   e.g. `github_pat_11A...` or a classic PAT starting with `ghp_`
 *
 * Validates credentials by calling GET /v1/models on the Azure AI Foundry
 * inference endpoint GitHub Models uses. A successful response confirms the
 * token has access to GitHub Models.
 *
 * GitHub Models does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapGitHub) to capture per-call costs instead.
 *
 * API docs: https://github.com/marketplace/models
 */
export const githubAdapter: ProviderAdapter = {
  type: 'github',

  async validateKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        'GitHub Personal Access Token is missing. Get one from https://github.com/settings/tokens.'
      );
    }

    const res = await fetch(
      'https://models.inference.ai.azure.com/v1/models',
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
        'Invalid GitHub Personal Access Token. Check your PAT at https://github.com/settings/tokens.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error?.message ?? `GitHub Models returned ${res.status}`
    );
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // GitHub Models does not provide a public usage/billing API.
    // Use wrapGitHub() SDK wrapper for per-call cost tracking.
    return [];
  },
};
