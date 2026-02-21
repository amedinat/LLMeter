/**
 * Security utilities for LLMeter
 * @module lib/security
 */

/** Static file extensions that should bypass auth middleware */
const STATIC_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

/**
 * Check if a pathname points to a static file by matching against known extensions.
 * This avoids the insecure `pathname.includes('.')` pattern that allows
 * middleware bypass with paths like `/dashboard/foo.bar`.
 */
export function isStaticFile(pathname: string): boolean {
  const lastDotIndex = pathname.lastIndexOf('.');
  if (lastDotIndex === -1) return false;
  const ext = pathname.slice(lastDotIndex).toLowerCase();
  return STATIC_EXTENSIONS.has(ext);
}

/**
 * Validate a redirect URL to prevent Open Redirect attacks.
 *
 * Only allows relative paths that start with `/` and don't start with `//`.
 * Rejects absolute URLs, protocol-relative URLs, and paths with `@` (userinfo).
 *
 * @param url - The redirect target to validate
 * @param fallback - Fallback URL if validation fails (default: '/dashboard')
 * @returns A safe redirect path
 */
export function safeRedirect(url: string | null | undefined, fallback = '/dashboard'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Must start with exactly one slash (not //)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  // Reject URLs with @ (could be protocol-relative with userinfo)
  if (trimmed.includes('@')) return fallback;

  // Reject URLs with backslash (some browsers normalize \ to /)
  if (trimmed.includes('\\')) return fallback;

  // Reject URLs that contain a colon before the first slash after the initial /
  // This catches cases like /http://evil.com
  const afterSlash = trimmed.slice(1);
  const colonIndex = afterSlash.indexOf(':');
  const slashIndex = afterSlash.indexOf('/');
  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) return fallback;

  return trimmed;
}

/**
 * Verify CSRF protection via custom header check.
 *
 * Browsers enforce that cross-origin requests with custom headers require
 * a CORS preflight. Since our API doesn't allow cross-origin requests,
 * a malicious site cannot send a request with `X-Requested-With`.
 *
 * All state-changing API calls from our frontend must include:
 *   `X-Requested-With: LLMeter`
 *
 * @param request - The incoming request to check
 * @returns true if the request includes the required CSRF header
 */
export function verifyCsrfHeader(request: Request): boolean {
  return request.headers.get('x-requested-with') === 'LLMeter';
}

/**
 * Return a 403 response for failed CSRF checks.
 */
export function csrfForbiddenResponse() {
  return new Response(
    JSON.stringify({ error: 'Forbidden: missing or invalid CSRF header' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
