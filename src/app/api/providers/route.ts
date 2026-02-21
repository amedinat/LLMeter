import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { connectProviderSchema } from '@/lib/validators/provider';
import { encryptForDB } from '@/lib/crypto';
import { getAdapter } from '@/lib/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';

const PROVIDER_API_LIMIT = { limit: 30, windowMs: 60 * 1000 }; // 30 req/min

/**
 * GET /api/providers — List user's connected providers (no keys exposed)
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('providers')
    .select('id, provider, display_name, status, last_sync_at, last_error, config, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/providers error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }

  return NextResponse.json({ providers: data });
}

/**
 * POST /api/providers — Connect a new provider
 * Body: { provider: "openai"|"anthropic", apiKey: "sk-...", displayName?: "My Key" }
 */
export async function POST(request: Request) {
  // CSRF protection: reject cross-origin forged requests
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit by user ID
  const rl = checkRateLimit(`providers:${user.id}`, PROVIDER_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = connectProviderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { provider, apiKey, displayName } = parsed.data;

  // Validate key against provider API before saving
  try {
    const adapter = getAdapter(provider);
    await adapter.validateKey(apiKey);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown validation error';
    return NextResponse.json(
      { error: `Invalid API Key: ${message}` },
      { status: 400 }
    );
  }

  // Encrypt the API key
  const encrypted = encryptForDB(apiKey);

  const { data, error } = await supabase
    .from('providers')
    .insert({
      user_id: user.id,
      provider,
      display_name: displayName ?? null,
      ...encrypted,
      status: 'active',
    })
    .select('id, provider, display_name, status, created_at')
    .single();

  if (error) {
    // Unique constraint violation = already connected
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `You already have a ${provider} provider connected. Disconnect it first.` },
        { status: 409 }
      );
    }
    console.error('POST /api/providers error:', error.message);
    return NextResponse.json({ error: 'Failed to connect provider' }, { status: 500 });
  }

  return NextResponse.json({ provider: data }, { status: 201 });
}
