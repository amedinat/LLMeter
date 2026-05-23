import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Snowflake Cortex AI adapter.
 *
 * Credentials format: `{account}::{token}`
 *   e.g. `myorg-myaccount.us-east-1::eyJhbGciOi...`
 *
 * The account identifier is the Snowflake account locator (org-account.region or legacy account ID).
 * The token can be a JWT or a Personal Access Token (PAT) generated in Snowflake settings.
 *
 * Validates credentials by posting a minimal inference request to the Cortex endpoint.
 * Snowflake Cortex does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapSnowflake) to capture per-call costs instead.
 *
 * API docs: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-llm-rest-api
 */
export const snowflakeAdapter: ProviderAdapter = {
  type: 'snowflake',

  async validateKey(credentials: string): Promise<boolean> {
    const { account, token } = parseSnowflakeCredentials(credentials);

    const res = await fetch(
      `https://${account}.snowflakecomputing.com/api/v2/cortex/inference:complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 1,
        }),
      }
    );

    if (res.ok) return true;

    const body = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid Snowflake credentials. Check your account identifier and token at docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-llm-rest-api.'
      );
    }

    throw new Error(
      body?.message ?? body?.error ?? `Snowflake Cortex returned ${res.status}`
    );
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Snowflake Cortex does not provide a public usage/billing API.
    // Use wrapSnowflake() SDK wrapper for per-call cost tracking.
    return [];
  },
};

/**
 * Parse the combined credentials string `account::token`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseSnowflakeCredentials(credentials: string): {
  account: string;
  token: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'Snowflake credentials must be in the format: your-account-identifier::your-token'
    );
  }

  const account = credentials.slice(0, idx).trim();
  const token = credentials.slice(idx + sep.length).trim();

  if (!account) {
    throw new Error('Snowflake account identifier is missing before ::');
  }
  if (!token) {
    throw new Error(
      'Snowflake token is missing after ::. Generate a JWT or Personal Access Token in your Snowflake account settings.'
    );
  }

  return { account, token };
}
