import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProviderSchema } from '@/lib/validators/provider';

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
