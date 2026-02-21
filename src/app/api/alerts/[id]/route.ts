import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateAlertSchema } from '@/lib/validators/alert';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';

const ALERT_API_LIMIT = { limit: 30, windowMs: 60 * 1000 };

/**
 * PATCH /api/alerts/[id] — Update an alert (toggle enabled, update config)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`alerts:${user.id}`, ALERT_API_LIMIT);
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

  const parsed = updateAlertSchema.safeParse({ id, ...body });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
  if (parsed.data.config !== undefined) updates.config = parsed.data.config;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('PATCH /api/alerts/[id] error:', error.message);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json({ alert: data });
}

/**
 * DELETE /api/alerts/[id] — Delete an alert
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`alerts:${user.id}`, ALERT_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('DELETE /api/alerts/[id] error:', error.message);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
