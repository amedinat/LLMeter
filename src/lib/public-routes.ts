/**
 * Routes served without a Supabase session (see src/proxy.ts).
 * Kept in its own module so it can be unit-tested without importing the proxy.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/refund',
  '/pricing',
  '/demo',
  '/compare',
  '/migrate',
  '/models',
  '/validate',
  '/extension',
  '/api/extension',
  '/api/waitlist',
  '/blog',
  '/robots.txt',
  '/sitemap.xml',
] as const;

/** True when `pathname` is one of PUBLIC_ROUTES or nested under it (segment-aware). */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
