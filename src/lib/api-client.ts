/**
 * Authenticated API client for LLMeter frontend.
 *
 * Automatically includes the `X-Requested-With: LLMeter` header
 * required for CSRF protection on state-changing endpoints.
 *
 * @module lib/api-client
 */

const CSRF_HEADER = { 'X-Requested-With': 'LLMeter' } as const;

/**
 * Fetch wrapper that injects CSRF and JSON headers.
 * Use this for all frontend → API calls to state-changing endpoints.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Always include CSRF header
  headers.set('X-Requested-With', 'LLMeter');

  // Default to JSON content type for requests with a body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}

export { CSRF_HEADER };
