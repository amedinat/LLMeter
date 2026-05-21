import { createHmac, createHash } from 'crypto';
import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * AWS Bedrock adapter.
 *
 * Credentials format: `region::accessKeyId::secretAccessKey`
 *   e.g. `us-east-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
 *
 * Validates the connection by listing foundation models via the Bedrock control-plane API.
 * AWS Bedrock does not expose a per-model usage/billing API accessible by access key —
 * use the `wrapBedrock()` SDK wrapper to push per-call usage at inference time.
 *
 * API docs: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListFoundationModels.html
 */
export const bedrockAdapter: ProviderAdapter = {
  type: 'bedrock',

  async validateKey(credentials: string): Promise<boolean> {
    const { region, accessKeyId, secretAccessKey } = parseBedrockCredentials(credentials);

    const host = `bedrock.${region}.amazonaws.com`;
    const path = '/foundation-models';
    const url = `https://${host}${path}`;

    const headers = signBedrockRequest('GET', path, host, region, accessKeyId, secretAccessKey);

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 403) {
        throw new Error(
          body?.message ??
            'Invalid AWS credentials or missing bedrock:ListFoundationModels permission.'
        );
      }
      if (res.status === 401) {
        throw new Error('AWS authentication failed. Check your Access Key ID and Secret Access Key.');
      }
      if (res.status === 404) {
        throw new Error(`AWS Bedrock is not available in region "${region}". Try us-east-1 or us-west-2.`);
      }
      throw new Error(body?.message ?? `AWS Bedrock returned ${res.status}`);
    }

    return true;
  },

  async fetchUsage(
    _credentials: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // AWS Bedrock does not expose a per-model usage/billing API via access keys.
    // Use wrapBedrock() from the llmeter SDK to capture per-call costs at inference time.
    return [];
  },
};

/**
 * Parse the combined credentials string `region::accessKeyId::secretAccessKey`.
 * Throws a descriptive error if the format is wrong.
 */
export function parseBedrockCredentials(credentials: string): {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  const parts = credentials.split('::');

  if (parts.length !== 3) {
    throw new Error(
      'AWS Bedrock credentials must be in the format: region::accessKeyId::secretAccessKey\n' +
        'Example: us-east-1::AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    );
  }

  const [region, accessKeyId, secretAccessKey] = parts.map((p) => p.trim());

  if (!region) throw new Error('AWS region is missing (e.g. us-east-1).');
  if (!accessKeyId) throw new Error('AWS Access Key ID is missing.');
  if (!secretAccessKey) throw new Error('AWS Secret Access Key is missing.');

  return { region, accessKeyId, secretAccessKey };
}

// ── Minimal AWS Signature Version 4 ──────────────────────────────────────────

function sha256hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

/**
 * Build AWS SigV4 signed headers for a GET request with no body.
 */
function signBedrockRequest(
  method: string,
  path: string,
  host: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  now: Date = new Date()
): Record<string, string> {
  const service = 'bedrock';

  // ISO string: "2026-05-21T10:11:08.000Z" → "20260521T101108Z"
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = path;
  const canonicalQueryString = '';
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-date';
  const payloadHash = sha256hex('');

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    Authorization: authorization,
    'x-amz-date': amzDate,
    host,
  };
}
