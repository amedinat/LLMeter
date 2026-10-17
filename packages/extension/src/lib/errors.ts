import type { ProviderId } from './types';
import { PROVIDER_LABELS } from './types';

/** User-facing error for a failed provider request. */
export class ProviderError extends Error {
  readonly status: number | null;
  readonly code: 'unauthorized' | 'forbidden' | 'rate_limited' | 'network' | 'invalid_response' | 'http';

  constructor(
    code: ProviderError['code'],
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
  }
}

/** Map an HTTP status from a provider into a readable message. */
export function describeHttpError(provider: ProviderId, status: number, bodySnippet = ''): ProviderError {
  const label = PROVIDER_LABELS[provider];
  const hint = bodySnippet ? ` (${bodySnippet})` : '';
  switch (status) {
    case 401:
      return new ProviderError(
        'unauthorized',
        `${label} rejected the key (401). Check that you pasted an *admin* key, not a regular API key.`,
        status,
      );
    case 403:
      return new ProviderError(
        'forbidden',
        `${label} says this key lacks admin/organization permissions (403). Create an admin key from the organization settings.`,
        status,
      );
    case 429:
      return new ProviderError(
        'rate_limited',
        `${label} rate limit hit (429). The extension refreshes every 6 hours; try again in a minute.`,
        status,
      );
    default:
      return new ProviderError('http', `${label} returned HTTP ${status}${hint}.`, status);
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
