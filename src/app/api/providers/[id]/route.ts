import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateProviderSchema } from '@/lib/validators/provider';
import { decryptFromDB } from '@/lib/crypto';
import { getAdapter } from '@/lib/providers/registry';
import { inngest } from '@/lib/inngest/client';
import type { ProviderType } from '@/types';

/**
 * DELETE /api/providers/:id — Disconnect a provider (delete encrypted key)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RLS ensures user can only delete own providers
  const { error } = await supabase
    .from('providers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/providers/:id — Update provider (display name, re-key)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateProviderSchema.safeParse({ ...body as Record<string, unknown>, id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.displayName !== undefined) {
    updates.display_name = parsed.data.displayName;
  }

  if (parsed.data.apiKey) {
    // Re-encrypt with new key
    const { encryptForDB } = await import('@/lib/crypto');
    const encrypted = encryptForDB(parsed.data.apiKey);
    Object.assign(updates, encrypted);
    updates.status = 'active';
    updates.last_error = null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, provider, display_name, status, last_sync_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}

/**
 * POST /api/providers/:id — Retry sync for a provider in error/syncing state
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the provider
  const { data: provider, error: fetchError } = await supabase
    .from('providers')
    .select('id, provider, api_key_encrypted, api_key_iv, api_key_tag, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  }

  // Mark as syncing
  await supabase
    .from('providers')
    .update({ status: 'syncing' })
    .eq('id', id);

  // Try Inngest first, fallback to inline
  try {
    await inngest.send({
      name: 'provider/connected',
      data: { providerId: id, userId: user.id },
    });
    return NextResponse.json({ success: true, status: 'syncing', method: 'inngest' });
  } catch {
    // Inngest unavailable — sync inline
  }

  try {
    const adapter = getAdapter(provider.provider as ProviderType);
    const apiKey = decryptFromDB({
      api_key_encrypted: provider.api_key_encrypted,
      api_key_iv: provider.api_key_iv,
      api_key_tag: provider.api_key_tag,
    });

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - 30);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);

    const records = await adapter.fetchUsage(apiKey, startDate, endDate);

    if (records.length > 0) {
      const adminSupabase = createAdminClient();
      const rows = records.map((r) => ({
        provider_id: id,
        user_id: user.id,
        date: r.date,
        model: r.model,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        requests: r.requests,
        cost_usd: r.costUsd,
      }));

      const { error: upsertError } = await adminSupabase
        .from('usage_records')
        .upsert(rows, { onConflict: 'provider_id,date,model', ignoreDuplicates: false });

      if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`);
    }

    await supabase
      .from('providers')
      .update({ status: 'active', last_sync_at: new Date().toISOString(), last_error: null })
      .eq('id', id);

    return NextResponse.json({ success: true, status: 'active', records: records.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from('providers')
      .update({ status: 'error', last_error: message })
      .eq('id', id);

    return NextResponse.json({ error: `Sync failed: ${message}`, status: 'error' }, { status: 500 });
  }
}
