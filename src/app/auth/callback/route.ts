import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/lib/security';
import { sendWelcomeEmail } from '@/lib/email/send-billing';
import { pulseTrack } from '@/lib/saas-pulse';

function getRedirectBase(request: Request, origin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (isLocalEnv) return origin;
  if (forwardedHost) return `https://${forwardedHost}`;
  return origin;
}

/**
 * Send welcome email if this is a new user (created within last 2 minutes).
 * Non-blocking — fires and forgets so it doesn't delay the redirect.
 */
async function maybeSendWelcomeEmail(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const isNewUser = now.getTime() - createdAt.getTime() < 2 * 60 * 1000;

    if (isNewUser) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
      sendWelcomeEmail({ email: user.email!, name }).catch((err) =>
        console.error('[auth/callback] Failed to send welcome email:', err)
      );
      pulseTrack('signup', { user_ref: user.id, metadata: { source: 'email' } });
    }
  } catch (err) {
    console.error('[auth/callback] Error in maybeSendWelcomeEmail:', err);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const errorDescription = searchParams.get('error_description');
  const next = safeRedirect(searchParams.get('next'));
  const base = getRedirectBase(request, origin);

  // Handle error from Supabase (e.g., expired magic link)
  if (errorDescription) {
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(errorDescription)}`,
      { status: 307 }
    );
  }

  // Handle PKCE code exchange (OAuth / Magic Link with code)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await maybeSendWelcomeEmail(supabase);
      return NextResponse.redirect(`${base}${next}`, { status: 307 });
    }
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`,
      { status: 307 }
    );
  }

  // Handle OTP token_hash flow (older magic links)
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    });
    if (!error) {
      await maybeSendWelcomeEmail(supabase);
      return NextResponse.redirect(`${base}${next}`, { status: 307 });
    }
    return NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`,
      { status: 307 }
    );
  }

  // No valid params
  return NextResponse.redirect(
    `${base}/login?error=Could not authenticate user`,
    { status: 307 }
  );
}
