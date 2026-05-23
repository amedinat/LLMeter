import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * IBM WatsonX.ai adapter.
 *
 * Credentials format: `{apiKey}::{projectId}`
 *   e.g. `my-ibm-cloud-api-key::my-watsonx-project-id`
 *
 * Validates the API key by exchanging it for an IBM Cloud IAM access token.
 * IBM WatsonX does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapWatsonX) to capture per-call costs instead.
 *
 * API docs: https://cloud.ibm.com/apidocs/watsonx-ai
 */
export const watsonxAdapter: ProviderAdapter = {
  type: 'watsonx',

  async validateKey(credentials: string): Promise<boolean> {
    const { apiKey } = parseWatsonXCredentials(credentials);

    // Validate by exchanging API key for IAM access token.
    // A successful token exchange confirms the key is valid.
    const body = new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    });

    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 || res.status === 401) {
        throw new Error(
          'Invalid IBM Cloud API key. Get your key from cloud.ibm.com/iam/apikeys.'
        );
      }
      throw new Error(
        data?.errorMessage ?? data?.message ?? `IBM IAM returned ${res.status}`
      );
    }

    const data = await res.json().catch(() => ({}));
    if (!data?.access_token) {
      throw new Error('IBM IAM did not return an access token. Check your API key.');
    }

    return true;
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // IBM WatsonX does not provide a public usage/billing API accessible via API key.
    // Use wrapWatsonX() SDK wrapper for per-call cost tracking.
    return [];
  },
};

/**
 * Parse the combined credentials string `apiKey::projectId`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseWatsonXCredentials(credentials: string): {
  apiKey: string;
  projectId: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'WatsonX credentials must be in the format: your-ibm-cloud-api-key::your-project-id'
    );
  }

  const apiKey = credentials.slice(0, idx).trim();
  const projectId = credentials.slice(idx + sep.length).trim();

  if (!apiKey) {
    throw new Error('IBM Cloud API key is missing before ::');
  }
  if (!projectId) {
    throw new Error(
      'WatsonX project ID is missing after ::. Find it at dataplatform.cloud.ibm.com under your project settings.'
    );
  }

  return { apiKey, projectId };
}
