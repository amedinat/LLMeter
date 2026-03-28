import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCustomerSchema } from '@/lib/validators/customer';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getCustomerDetail } from '@/features/customers/server/queries';

const CUSTOMER_API_LIMIT = { limit: 30, windowMs: 60_000 };

/**
 * GET /api/customers/[id] — Get customer detail
 */
export async function GET(
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

  try {
    const customer = await getCustomerDetail(user.id, id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ customer });
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

/**
 * PUT /api/customers/[id] — Update customer display_name and metadata
 */
export async function PUT(
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

  const rl = checkRateLimit(`customers:${user.id}`, CUSTOMER_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('customers')
    .update({
      display_name: parsed.data.display_name,
      metadata: parsed.data.metadata ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('PUT /api/customers/[id] error:', error.message);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customer: data });
}

/**
 * DELETE /api/customers/[id] — Delete a customer record
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

  const rl = checkRateLimit(`customers:${user.id}`, CUSTOMER_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('DELETE /api/customers/[id] error:', error.message);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
