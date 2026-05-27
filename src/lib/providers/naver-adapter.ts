import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * NAVER HyperCLOVA X adapter.
 *
 * Credentials format: `{apiKeyId}::{serviceKey}`
 *   e.g. `ncp_key_id_abc123::ncp_service_key_xyz789`
 *
 * Both values are obtained from the NAVER Cloud Platform (NCP) console
 * under AI Services > CLOVA Studio > API Keys.
 *
 * Validates by sending a minimal POST request to the CLOVA Studio
 * chat-completions endpoint. A 200 response confirms the credentials are valid;
 * 401/403 indicates an invalid key pair.
 *
 * NAVER does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapNaver) to capture per-call costs instead.
 *
 * API docs: https://api.ncloud-docs.com/docs/ai-naver-clovastudio-chat
 */
export const naverAdapter: ProviderAdapter = {
  type: 'naver',

  async validateKey(credentials: string): Promise<boolean> {
    const { apiKeyId, serviceKey } = parseNaverCredentials(credentials);

    const res = await fetch(
      'https://clovastudio.stream.naver.com/testapp/v1/chat-completions/HCX-DASH-001',
      {
        method: 'POST',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': apiKeyId,
          'X-NCP-APIGW-API-KEY': serviceKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hi' }],
          maxTokens: 1,
          stream: false,
        }),
      }
    );

    if (res.ok) return true;

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid NAVER CLOVA Studio credentials. Get your API Key ID and Service Key from console.ncloud.com under AI Services > CLOVA Studio.'
      );
    }

    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.status?.message ?? `NAVER CLOVA Studio returned ${res.status}`
    );
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // NAVER CLOVA Studio does not provide a public usage/billing API.
    // Use wrapNaver() SDK wrapper for per-call cost tracking.
    return [];
  },
};

/**
 * Parse the combined credentials string `apiKeyId::serviceKey`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseNaverCredentials(credentials: string): {
  apiKeyId: string;
  serviceKey: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'NAVER CLOVA Studio credentials must be in the format: your-api-key-id::your-service-key (both from console.ncloud.com)'
    );
  }

  const apiKeyId = credentials.slice(0, idx).trim();
  const serviceKey = credentials.slice(idx + sep.length).trim();

  if (!apiKeyId) {
    throw new Error('NAVER API Key ID is missing before ::');
  }
  if (!serviceKey) {
    throw new Error(
      'NAVER Service Key is missing after ::. Find both values at console.ncloud.com under AI Services > CLOVA Studio > API Keys.'
    );
  }

  return { apiKeyId, serviceKey };
}
