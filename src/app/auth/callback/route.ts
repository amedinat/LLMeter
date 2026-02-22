import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/security';

/**
 * Auth callback handler for Supabase.
 *
 * Handles two flows:
 * 1. PKCE flow (magic link / OAuth): receives `code` param, exchanges for session.
 * 2. Implicit/hash flow (older magic link): receives `token_hash` + `type` params.
 *
 * On Vercel, x-forwarded-host provides the canonical domain for redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'invite'
    | 'magiclink'
    | 'email'
    | null;
  // Validate redirect target to prevent Open Redirect (US-11.2)
  const next = safeRedirect(searchParams.get('next'));

  const supabase = await createClient();

  // Determine the redirect base URL
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  let redirectBase: string;
  if (isLocalEnv) {
    redirectBase = origin;
  } else if (forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  } else {
    redirectBase = origin;
  }

  // Flow 1: PKCE code exchange (preferred)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    console.error('Auth callback: code exchange failed:', error.message);
  }

  // Flow 2: Token hash verification (email link with token_hash + type)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${next}`);
    }
    console.error('Auth callback: OTP verification failed:', error.message);
  }

  // If we get here with an error in the hash fragment, the client-side will handle it
  // (Supabase sometimes puts error info in the URL hash, not search params)
  const errorDescription = searchParams.get('error_description');
  const errorMsg = errorDescription || 'Could not authenticate user';

  return NextResponse.redirect(
    `${redirectBase}/login?error=${encodeURIComponent(errorMsg)}`
  );
}
