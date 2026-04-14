/**
 * Shared API key authentication for public v1 API routes.
 * Validates Bearer token, hashes it, and returns the user_id.
 */

import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NextRequest } from 'next/server';

export interface ApiKeyAuthSuccess {
  userId: string;
  apiKeyId: string;
}

export interface ApiKeyAuthError {
  error: string;
  status: number;
}

export type ApiKeyAuthResult = ApiKeyAuthSuccess | ApiKeyAuthError;

export function isAuthError(result: ApiKeyAuthResult): result is ApiKeyAuthError {
  return 'error' in result;
}

/**
 * Authenticate a request using Bearer API key.
 * Returns { userId, apiKeyId } on success or { error, status } on failure.
 */
export async function authenticateV1ApiKey(
  request: NextRequest | Request,
): Promise<ApiKeyAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing or invalid API key', status: 401 };
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active')
    .eq('api_key_hash', apiKeyHash)
    .single();

  if (error || !data) {
    return { error: 'Unauthorized: Invalid API key', status: 401 };
  }

  if (!data.is_active) {
    return { error: 'Unauthorized: API key is disabled', status: 403 };
  }

  // Update last_used_at best-effort (no await)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => undefined);

  return { userId: data.user_id, apiKeyId: data.id };
}
