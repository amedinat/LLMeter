'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, MAGIC_LINK_LIMIT } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Extract client IP from request headers for rate limiting.
 */
async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    'unknown'
  );
}

export async function loginWithMagicLink(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email) {
    redirect('/login?error=Email is required');
  }

  // Rate limit by IP and email (US-11.3)
  const ip = await getClientIP();
  const ipCheck = checkRateLimit(`magic-link:ip:${ip}`, MAGIC_LINK_LIMIT);
  const emailCheck = checkRateLimit(`magic-link:email:${email}`, MAGIC_LINK_LIMIT);

  if (!ipCheck.success || !emailCheck.success) {
    redirect('/login?error=Too many requests. Please try again later.');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=Check your email for a magic link');
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
