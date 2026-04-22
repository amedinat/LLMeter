'use server';

import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, MAGIC_LINK_LIMIT } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Detect the origin URL dynamically from request headers.
 * Works on Vercel (x-forwarded-host) and locally (host).
 */
async function getOrigin(): Promise<string> {
  const hdrs = await headers();
  const host =
    hdrs.get('x-forwarded-host') ||
    hdrs.get('host') ||
    'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

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

const VALID_PLANS = ['pro', 'team'] as const;
type ValidPlan = typeof VALID_PLANS[number];

function parsePlan(raw: FormDataEntryValue | null): ValidPlan | undefined {
  if (VALID_PLANS.includes(raw as ValidPlan)) return raw as ValidPlan;
  return undefined;
}

export async function loginWithMagicLink(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const plan = parsePlan(formData.get('plan'));

  if (!email) {
    redirect('/login?error=Email is required');
  }

  // Rate limit by IP and email (US-11.3)
  const ip = await getClientIP();
  const ipCheck = await checkRateLimit(`magic-link:ip:${ip}`, MAGIC_LINK_LIMIT);
  const emailCheck = await checkRateLimit(`magic-link:email:${email}`, MAGIC_LINK_LIMIT);

  if (!ipCheck.success || !emailCheck.success) {
    redirect('/login?error=Too many requests. Please try again later.');
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const nextPath = plan ? `/pricing?plan=${plan}` : '/dashboard';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const planParam = plan ? `&plan=${plan}` : '';
  redirect(`/login?message=Check your email for a magic link${planParam}`);
}

/** Rate limit config for password login/signup: 10 requests per 15 minutes */
const AUTH_PASSWORD_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

export async function loginWithPassword(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const plan = parsePlan(formData.get('plan'));

  if (!email || !password) {
    redirect('/login?error=Email and password are required&tab=password');
  }

  // Rate limit by IP
  const ip = await getClientIP();
  const ipCheck = await checkRateLimit(`auth-password:ip:${ip}`, AUTH_PASSWORD_LIMIT);
  if (!ipCheck.success) {
    redirect('/login?error=Too many requests. Please try again later.&tab=password');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const planParam = plan ? `&plan=${plan}` : '';
    redirect(`/login?error=${encodeURIComponent(error.message)}&tab=password${planParam}`);
  }

  redirect(plan ? `/pricing?plan=${plan}` : '/dashboard');
}

export async function signUpWithPassword(formData: FormData): Promise<void> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const plan = parsePlan(formData.get('plan'));

  if (!email || !password) {
    redirect('/login?error=Email and password are required&tab=password');
  }

  if (password.length < 8) {
    redirect('/login?error=Password must be at least 8 characters&tab=password');
  }

  // Rate limit by IP
  const ip = await getClientIP();
  const ipCheck = await checkRateLimit(`auth-signup:ip:${ip}`, AUTH_PASSWORD_LIMIT);
  if (!ipCheck.success) {
    redirect('/login?error=Too many requests. Please try again later.&tab=password');
  }

  const origin = await getOrigin();
  const supabase = await createClient();

  const nextPath = plan ? `/pricing?plan=${plan}` : '/dashboard';
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    const planParam = plan ? `&plan=${plan}` : '';
    redirect(`/login?error=${encodeURIComponent(error.message)}&tab=password${planParam}`);
  }

  const planParam = plan ? `&plan=${plan}` : '';
  redirect(`/login?message=Check your email to confirm your account&tab=password${planParam}`);
}

export async function loginWithGoogle(): Promise<void> {
  const origin = await getOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
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
