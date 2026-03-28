import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, INGEST_API_LIMIT } from '@/lib/rate-limit';
import { z } from 'zod';
import { createHash } from 'crypto';

const usageRecordSchema = z.object({
  model: z.string().min(1, 'model is required').max(200),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  customer_id: z.string().max(200).optional(),
  timestamp: z.string().datetime().optional(),
});

const ingestBodySchema = z.array(usageRecordSchema).min(1).max(1000);

/**
 * Authenticate request via Bearer token (API key).
 * The raw key is SHA-256 hashed and looked up in the api_keys table.
 */
async function authenticateApiKey(
  request: NextRequest
): Promise<{ userId: string; keyHash: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const rawKey = authHeader.slice(7);
  if (!rawKey) return null;

  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return null;

  return { userId: data.user_id as string, keyHash };
}

/**
 * POST /api/ingest — Ingest usage records via API key authentication
 */
export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  // Rate limit per API key
  const rl = checkRateLimit(`ingest:${auth.keyHash}`, INGEST_API_LIMIT);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 100 requests per minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ingestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Upsert customers if customer_id is provided
  const customerIds = [
    ...new Set(
      parsed.data
        .map((r) => r.customer_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  for (const customerId of customerIds) {
    await supabase
      .from('customers')
      .upsert(
        {
          customer_id: customerId,
          user_id: auth.userId,
          display_name: customerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'customer_id,user_id' }
      );
  }

  // Insert usage records
  const records = parsed.data.map((r) => ({
    user_id: auth.userId,
    model: r.model,
    input_tokens: r.input_tokens,
    output_tokens: r.output_tokens,
    customer_id: r.customer_id ?? null,
    timestamp: r.timestamp ?? new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('customer_usage_records')
    .insert(records);

  if (error) {
    console.error('POST /api/ingest error:', error.message);
    return NextResponse.json(
      { error: 'Failed to ingest records' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    records_ingested: records.length,
  });
}
