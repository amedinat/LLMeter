import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * GigaChat (Sberbank) adapter.
 *
 * Credentials format: the Authorization Key from developers.sber.ru
 *   (the base64-encoded clientId:clientSecret string Sberbank provides directly)
 *   e.g. `OGYzNDI4ZWEtM...` (base64-encoded, ~88 chars)
 *
 * Validates credentials by exchanging the Authorization Key for a JWT access token
 * via the Sberbank OAuth2 endpoint. A successful token exchange confirms validity.
 *
 * GigaChat does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapGigaChat) to capture per-call costs instead.
 *
 * API docs: https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/post-token
 */
export const gigachatAdapter: ProviderAdapter = {
  type: 'gigachat',

  async validateKey(authKey: string): Promise<boolean> {
    if (!authKey || !authKey.trim()) {
      throw new Error(
        'GigaChat Authorization Key is missing. Get it from developers.sber.ru.'
      );
    }

    const rqUid = crypto.randomUUID();

    const res = await fetch(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authKey.trim()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          RqUID: rqUid,
        },
        body: 'scope=GIGACHAT_API_PERS',
      }
    );

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (!data?.access_token) {
        throw new Error(
          'GigaChat OAuth endpoint did not return an access token. Check your Authorization Key.'
        );
      }
      return true;
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid GigaChat Authorization Key. Get a valid key from developers.sber.ru.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error_description ?? `GigaChat OAuth returned ${res.status}`
    );
  },

  async fetchUsage(
    _authKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // GigaChat does not provide a public usage/billing API.
    // Use wrapGigaChat() SDK wrapper for per-call cost tracking.
    return [];
  },
};
