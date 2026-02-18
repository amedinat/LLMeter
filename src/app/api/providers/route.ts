import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { connectProviderSchema } from '@/lib/validators/provider';
import { encryptForDB } from '@/lib/crypto';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data });
}

/**
 * POST /api/providers — Connect a new provider
 * Body: { provider: "openai"|"anthropic", apiKey: "sk-...", displayName?: "My Key" }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = connectProviderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { provider, apiKey, displayName } = parsed.data;

  // TODO: Validate key against provider API before saving
  // const adapter = getAdapter(provider);
  // await adapter.validateKey(apiKey);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data }, { status: 201 });
}
