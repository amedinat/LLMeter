import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { createHash } from 'node:crypto';

const BodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().min(1).max(64),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const WAITLIST_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'llmeter-waitlist';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`waitlist:${ip}`, WAITLIST_LIMIT);
  if (!rate.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { email, source, metadata } = parsed.data;
  const ipHash = hashIp(ip);
  const userAgent = request.headers.get('user-agent')?.slice(0, 512) ?? null;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('waitlist').insert({
      email: email.toLowerCase(),
      source,
      metadata: metadata ?? {},
      user_agent: userAgent,
      ip_hash: ipHash,
    });

    if (error) {
      // Unique violation = already on waitlist; treat as success.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      console.error('[waitlist] insert failed:', error.message, error.code);
      return NextResponse.json({ error: 'Could not save signup' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[waitlist] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
