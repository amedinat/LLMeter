import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { getModelPricing, getDefaultRates } from '@/data/model-pricing';
import { createHash } from 'crypto';
import { checkRateLimit, INGEST_API_LIMIT } from '@/lib/rate-limit';

// Zod schema for a single usage event from the SDK
const usageEventSchema = z.object({
  model: z.string().min(1),
  input_tokens: z.number().int().min(0),
  output_tokens: z.number().int().min(0),
  customer_id: z.string().min(1),
  timestamp: z.string().datetime().optional(),
});

// Zod schema for the entire payload (an array of events)
const ingestionSchema = z.array(usageEventSchema).min(1).max(1000);

// Helper to calculate cost for a single event
function calculateCost(event: z.infer<typeof usageEventSchema>): { cost: number; provider: string } {
  const pricing = getModelPricing(event.model);

  let inputRate: number, outputRate: number, provider: string;

  if (pricing) {
    inputRate = pricing.input_price_per_1m_tokens;
    outputRate = pricing.output_price_per_1m_tokens;
    provider = pricing.provider;
  } else {
    // Fallback for unknown models
    [inputRate, outputRate] = getDefaultRates('openai');
    provider = 'unknown';
  }

  const cost =
    (event.input_tokens / 1_000_000) * inputRate +
    (event.output_tokens / 1_000_000) * outputRate;

  return { cost, provider };
}


export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid API key' }, { status: 401 });
  }
  const apiKey = authHeader.split(' ')[1];

  // Hash the API key to look it up in the database
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

  const supabase = createAdminClient();

  // 1. Authenticate the request using the API key hash
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active')
    .eq('api_key_hash', apiKeyHash)
    .single();

  if (apiKeyError || !apiKeyData) {
    return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
  }

  if (!apiKeyData.is_active) {
    return NextResponse.json({ error: 'Unauthorized: API key is disabled' }, { status: 403 });
  }

  const { user_id, id: api_key_id } = apiKeyData;

  // Rate limit per API key
  const rl = checkRateLimit(`ingest:${apiKeyHash}`, INGEST_API_LIMIT);
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

  // 2. Parse and validate the request body
  let events;
  try {
    const body = await req.json();
    events = ingestionSchema.parse(body);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body', details: (error as z.ZodError).format() }, { status: 400 });
  }

  // 3. Process and insert usage data
  const recordsToInsert = events.map(event => {
    const { cost, provider } = calculateCost(event);
    return {
      user_id,
      api_key_id,
      customer_id: event.customer_id,
      model: event.model,
      provider,
      input_tokens: event.input_tokens,
      output_tokens: event.output_tokens,
      cost_usd: cost,
      timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    };
  });

  const { error: insertError } = await supabase
    .from('customer_usage_records')
    .insert(recordsToInsert);

  if (insertError) {
    console.error('Failed to insert customer usage records:', insertError);
    return NextResponse.json({ error: 'Failed to save usage data' }, { status: 500 });
  }

  // 4. Update the last_used_at timestamp on the API key (best-effort)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', api_key_id)
    .then(({ error: updateError }) => {
      if (updateError) {
        console.warn(`Failed to update last_used_at for API key ${api_key_id}:`, updateError);
      }
    });

  return NextResponse.json({ success: true, ingested: recordsToInsert.length }, { status: 202 });
}
