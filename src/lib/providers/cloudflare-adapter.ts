import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Cloudflare Workers AI adapter.
 *
 * Credentials format: `{accountId}::{apiToken}`
 *   e.g. `abc123def456::my-cloudflare-api-token`
 *
 * Validates the connection by searching for models via the Workers AI API.
 * Cloudflare Workers AI does not expose a per-token usage/billing API at this time;
 * costs appear in the Cloudflare dashboard under Account → Analytics.
 * Use the llmeter SDK wrapper (wrapCloudflare) for per-call cost tracking.
 *
 * API docs: https://developers.cloudflare.com/workers-ai/
 */
export const cloudflareAdapter: ProviderAdapter = {
  type: 'cloudflare',

  async validateKey(credentials: string): Promise<boolean> {
    const { accountId, apiToken } = parseCloudflareCredentials(credentials);

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?search=llama`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          body?.errors?.[0]?.message ??
            'Invalid Cloudflare API token or insufficient permissions.'
        );
      }
      if (res.status === 404) {
        throw new Error(
          'Cloudflare account not found. Check your Account ID in the Cloudflare dashboard.'
        );
      }
      throw new Error(
        body?.errors?.[0]?.message ??
          `Cloudflare API returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Cloudflare Workers AI does not expose a per-token usage/billing API.
    // Use wrapCloudflare() SDK wrapper for per-call cost tracking instead.
    return [];
  },
};

/**
 * Parse the combined credentials string `accountId::apiToken`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseCloudflareCredentials(credentials: string): {
  accountId: string;
  apiToken: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'Cloudflare credentials must be in the format: accountId::apiToken'
    );
  }

  const accountId = credentials.slice(0, idx).trim();
  const apiToken = credentials.slice(idx + sep.length).trim();

  if (!accountId) {
    throw new Error('Cloudflare Account ID is missing before ::');
  }
  if (!apiToken) {
    throw new Error('Cloudflare API token is missing after ::');
  }

  return { accountId, apiToken };
}
