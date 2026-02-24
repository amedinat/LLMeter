import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { connectProviderSchema } from '@/lib/validators/provider';
import { encryptForDB } from '@/lib/crypto';
import { getAdapter, getRegisteredProviders } from '@/lib/providers/registry';
import { inngest } from '@/lib/inngest/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, getPlanLimits } from '@/lib/feature-gate';
import type { ProviderType } from '@/types';

const PROVIDER_API_LIMIT = { limit: 30, windowMs: 60_000 };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('providers')
      .select('id, provider, display_name, status, last_sync_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    return NextResponse.json({ providers: data });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/providers — Connect a new provider
 * Body: { provider: "openai"|"anthropic", apiKey: "sk-...", displayName?: "My Key" }
 */
export async function POST(req: NextRequest) {
  if (!verifyCsrfHeader(req)) {
    return csrfForbiddenResponse();
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Enforce plan provider limit
    const plan = await getUserPlan();
    const limits = getPlanLimits(plan);
    if (limits.maxProviders !== Infinity) {
      const { count, error: countError } = await supabase
        .from('providers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('POST /api/providers count error:', countError.message);
        return NextResponse.json({ error: 'Failed to check provider limit' }, { status: 500 });
      }

      if ((count ?? 0) >= limits.maxProviders) {
        return NextResponse.json(
          { error: `Your ${plan} plan allows a maximum of ${limits.maxProviders} provider(s). Upgrade to add more.` },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const result = connectProviderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { provider, apiKey, displayName } = result.data;

    // Validate API key before saving
    const registeredProviders = getRegisteredProviders();
    if (registeredProviders.includes(provider as ProviderType)) {
      try {
        const adapter = getAdapter(provider as ProviderType);
        await adapter.validateKey(apiKey);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid API key';
        return NextResponse.json(
          { error: `API key validation failed: ${message}` },
          { status: 422 }
        );
      }
    }

    // Encrypt the API key
    const encryptedData = encryptForDB(apiKey);

    // Upsert provider
    const { data, error } = await supabase
      .from('providers')
      .upsert({
        user_id: user.id,
        provider,
        api_key_encrypted: encryptedData.api_key_encrypted,
        api_key_iv: encryptedData.api_key_iv,
        api_key_tag: encryptedData.api_key_tag,
        display_name: displayName || null,
        status: 'syncing',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, provider' })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Trigger initial data sync via Inngest
    try {
      await inngest.send({
        name: 'provider/connected',
        data: { providerId: data.id, userId: user.id },
      });
    } catch (inngestErr) {
      // Non-blocking: provider saved even if Inngest fails
      console.warn('Inngest event send failed:', inngestErr);
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: data.id,
        provider: data.provider,
        display_name: data.display_name,
        status: data.status,
      }
    });
  } catch (error) {
    console.error('Error saving provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
