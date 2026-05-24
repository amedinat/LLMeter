import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Oracle Cloud Infrastructure (OCI) Generative AI adapter.
 *
 * Credentials format: `{compartmentId}::{authToken}`
 *   e.g. `ocid1.compartment.oc1..aaa...::eyJhbGci...`
 *
 * The compartmentId is the OCID of the OCI compartment to bill against.
 * The authToken is an OCI session token generated via `oci session authenticate`
 * or an API key token from the OCI console (Profile → Auth Tokens).
 *
 * Validates credentials by posting a minimal inference request.
 * OCI Generative AI does not expose a public per-day usage/billing API,
 * so fetchUsage returns empty records.
 * Use the llmeter SDK wrapper (wrapOCI) to capture per-call costs instead.
 *
 * API docs: https://docs.oracle.com/en-us/iaas/api/#/en/generative-ai-inference/20231130/
 */
export const ociAdapter: ProviderAdapter = {
  type: 'oci',

  async validateKey(credentials: string): Promise<boolean> {
    const { compartmentId, authToken } = parseOCICredentials(credentials);

    const res = await fetch(
      'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compartmentId,
          servingMode: {
            modelId: 'meta.llama-3.1-8b-instruct',
            servingType: 'ON_DEMAND',
          },
          chatRequest: {
            messages: [{ role: 'USER', content: [{ type: 'TEXT', text: 'hi' }] }],
            apiFormat: 'GENERIC',
            maxTokens: 1,
          },
        }),
      }
    );

    if (res.ok) return true;

    const body = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'Invalid OCI credentials. Check your compartmentId and authToken at cloud.oracle.com.'
      );
    }

    throw new Error(
      body?.message ?? body?.code ?? `OCI Generative AI returned ${res.status}`
    );
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // OCI Generative AI does not provide a public usage/billing API.
    // Use wrapOCI() SDK wrapper for per-call cost tracking.
    return [];
  },
};

/**
 * Parse the combined credentials string `compartmentId::authToken`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseOCICredentials(credentials: string): {
  compartmentId: string;
  authToken: string;
} {
  const sep = '::';
  const idx = credentials.indexOf(sep);

  if (idx === -1) {
    throw new Error(
      'OCI credentials must be in the format: your-compartment-ocid::your-auth-token'
    );
  }

  const compartmentId = credentials.slice(0, idx).trim();
  const authToken = credentials.slice(idx + sep.length).trim();

  if (!compartmentId) {
    throw new Error('OCI compartmentId is missing before ::');
  }
  if (!authToken) {
    throw new Error(
      'OCI authToken is missing after ::. Generate a session token via: oci session authenticate'
    );
  }

  return { compartmentId, authToken };
}
