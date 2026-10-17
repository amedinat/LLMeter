/**
 * POST /api/extension/license/validate
 *
 * Called by the LLMeter Live Cost browser extension to unlock Pro features.
 * Body: { key: "LLM-XXXX-XXXX-XXXX-XXXX", device_id: "<random id>" }
 * 200 { valid: true,  plan: "pro" }
 * 200 { valid: false, error: "<reason>" }   (unknown / revoked / device limit)
 * 400 malformed body · 429 rate limited
 *
 * Public, unauthenticated, CORS-open: the extension has no host permission for
 * llmeter.org, so the browser enforces CORS on this cross-origin fetch.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashLicenseKey, isValidLicenseKeyFormat, normalizeLicenseKey } from '@/lib/extension-license';

const BodySchema = z.object({
  key: z.string().min(1).max(64),
  device_id: z.string().min(8).max(128),
});

const RATE_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 } as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
} as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`ext-license:${ip}`, RATE_LIMIT);
  if (!rate.success) {
    return json({ valid: false, error: 'Too many requests' }, 429);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ valid: false, error: 'Invalid JSON' }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ valid: false, error: 'Invalid request' }, 400);
  }

  const { device_id: deviceId } = parsed.data;
  const key = normalizeLicenseKey(parsed.data.key);
  if (!isValidLicenseKeyFormat(key)) {
    return json({ valid: false, error: 'License key format is invalid.' });
  }

  try {
    const supabase = createAdminClient();
    const { data: license, error } = await supabase
      .from('extension_licenses')
      .select('id, status, max_devices')
      .eq('key_hash', hashLicenseKey(key))
      .maybeSingle();

    if (error) {
      console.error('[ext-license] lookup failed:', error.message);
      return json({ valid: false, error: 'Could not validate right now.' }, 500);
    }
    if (!license) {
      return json({ valid: false, error: 'License key not found.' });
    }
    if (license.status !== 'active') {
      return json({ valid: false, error: 'This license has been revoked.' });
    }

    // Device binding: allow up to max_devices distinct device ids.
    const { data: devices } = await supabase
      .from('extension_license_devices')
      .select('device_id')
      .eq('license_id', license.id);

    const known = (devices ?? []).some((d) => d.device_id === deviceId);
    if (!known && (devices?.length ?? 0) >= license.max_devices) {
      return json({
        valid: false,
        error: `Device limit reached (${license.max_devices}). Contact support@llmeter.org to reset.`,
      });
    }

    const now = new Date().toISOString();
    await supabase
      .from('extension_license_devices')
      .upsert(
        { license_id: license.id, device_id: deviceId, last_seen_at: now },
        { onConflict: 'license_id,device_id' },
      );
    await supabase
      .from('extension_licenses')
      .update({ last_validated_at: now })
      .eq('id', license.id);

    return json({ valid: true, plan: 'pro' });
  } catch (err) {
    console.error('[ext-license] unexpected error:', err);
    return json({ valid: false, error: 'Internal error' }, 500);
  }
}
