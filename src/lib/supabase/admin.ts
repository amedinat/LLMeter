import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client for server-side background jobs.
 * Uses the service role key — **bypasses RLS**.
 *
 * ## Authorized callers
 * - `src/lib/inngest/functions.ts` — background ingestion & sync jobs
 * - `src/lib/email/send-alert.ts`  — alert email delivery
 *
 * **DO NOT** use this client in API route handlers or any code
 * reachable from user-facing HTTP requests. Use the per-request
 * Supabase client from `@/lib/supabase/server` instead.
 *
 * Any new usage must be documented here and reviewed for necessity.
 *
 * @module lib/supabase/admin
 */

/** Caller identifiers for audit logging */
type AdminCaller =
  | 'inngest:sync-provider-usage'
  | 'inngest:process-usage-events'
  | 'inngest:check-budget-alerts'
  | 'email:send-alert';

/**
 * Create an admin Supabase client with audit logging.
 *
 * @param caller - Identifier of the calling function for audit trail.
 *                 Must match an authorized caller listed above.
 */
export function createAdminClient(caller?: AdminCaller) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  if (caller) {
    // Audit log: record who is using the admin client and when
    console.info(`[admin-client] created by: ${caller} at ${new Date().toISOString()}`);
  } else {
    // Warn if caller is not specified — helps catch unaudited usage
    console.warn(
      '[admin-client] WARNING: createAdminClient called without caller identifier. ' +
      'All admin client usage should specify a caller for audit purposes.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
