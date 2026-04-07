import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isStaticFile } from '@/lib/security';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/auth/callback', '/api/cron', '/privacy', '/terms', '/pricing', '/migrate', '/robots.txt', '/sitemap.xml'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes and known static file extensions
  if (
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    isStaticFile(pathname)
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - IMPORTANT: must call getUser, not getSession
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user tries to access login, redirect to dashboard
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Throttled last_seen_at update (once every 5 minutes via cookie)
  const LAST_SEEN_COOKIE = 'llm_last_seen';
  const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
  const lastSeenCookie = request.cookies.get(LAST_SEEN_COOKIE)?.value;
  const now = Date.now();

  if (!lastSeenCookie || now - parseInt(lastSeenCookie, 10) > THROTTLE_MS) {
    // Fire-and-forget: update last_seen_at using the user's own session (anon key + JWT)
    // Never use service role key in middleware — it bypasses all RLS
    Promise.resolve(
      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id)
    )
      .then(({ error }) => {
        if (error) {
          console.error('[middleware] last_seen_at update failed:', error.message);
        }
      })
      .catch(() => {
        // Silently ignore — analytics should never break the app
      });
    supabaseResponse.cookies.set(LAST_SEEN_COOKIE, now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
