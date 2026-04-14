import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1ApiKey, isAuthError } from '@/lib/v1-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/v1/providers — List connected LLM providers and their sync status.
 *
 * Auth: Bearer <api_key>
 *
 * Returns all providers the authenticated user has connected,
 * including sync status and last sync timestamp.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateV1ApiKey(request);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = auth;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('providers')
    .select('id, provider, display_name, status, last_sync_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('v1/providers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }

  return NextResponse.json({ providers: data ?? [] });
}
