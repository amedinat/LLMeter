import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client for server-side background jobs (Inngest).
 * Uses the service role key — bypasses RLS.
 * NEVER expose this client to the frontend.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
