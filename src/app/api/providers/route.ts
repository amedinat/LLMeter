import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { connectProviderSchema } from '@/lib/validators/provider';
import { encryptForDB, decryptFromDB } from '@/lib/crypto';
import { getAdapter, getRegisteredProviders } from '@/lib/providers/registry';
import { inngest } from '@/lib/inngest/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, getPlanLimits } from '@/lib/feature-gate';
import { evaluateAlertsInline } from '@/lib/alerts/evaluate-inline';
import { sanitizeErrorForStorage, sanitizeErrorForClient } from '@/lib/error-sanitizer';
import type { ProviderType } from '@/types';

const PROVIDER_API_LIMIT = { limit: 30, windowMs: 60_000 };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getUserPlan();

    const { data, error } = await supabase
      .from('providers')
      .select('id, provider, display_name, status, last_sync_at, last_error, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    return NextResponse.json({ providers: data, plan });
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
    
    const body = await req.json();
    const result = connectProviderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { provider, apiKey, displayName } = result.data;

    // Check plan constraints
    if (provider === 'openrouter' && plan === 'free') {
      return NextResponse.json(
        { error: 'OpenRouter is a Pro feature. Please upgrade your plan to connect it.' },
        { status: 403 }
      );
    }

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

    // Trigger initial data sync via Inngest, with inline fallback
    let syncResult: { method: 'inngest' | 'inline'; records?: number; error?: string } = { method: 'inngest' };
    let finalStatus = 'syncing';

    try {
      await inngest.send({
        name: 'provider/connected',
        data: { providerId: data.id, userId: user.id },
      });
    } catch (inngestErr) {
      // Inngest unavailable — do the initial sync inline
      console.warn('Inngest unavailable, syncing inline:', inngestErr);
      syncResult.method = 'inline';

      try {
        const adapter = getAdapter(provider as ProviderType);
        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);

        console.warn(`[SYNC] Fetching ${provider} usage from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        const records = await adapter.fetchUsage(apiKey, startDate, endDate);
        console.warn(`[SYNC] ${provider} returned ${records.length} records`);

        if (records.length > 0) {
          const adminSupabase = createAdminClient();
          const rows = records.map((r) => ({
            provider_id: data.id,
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
          console.warn(`[SYNC] Upserted ${rows.length} rows for ${provider}`);
        } else {
          console.warn(`[SYNC] ${provider} returned 0 records — nothing to insert`);
        }

        // Mark as active
        await supabase
          .from('providers')
          .update({ status: 'active', last_sync_at: new Date().toISOString(), last_error: null })
          .eq('id', data.id);

        finalStatus = 'active';
        syncResult.records = records.length;

        // Evaluate alerts inline (best-effort, don't block response)
        evaluateAlertsInline(user.id).catch((err) =>
          console.warn('[alerts] Inline evaluation failed:', err)
        );
      } catch (syncErr) {
        const rawMessage = syncErr instanceof Error ? syncErr.message : String(syncErr);
        console.error('Inline sync failed:', rawMessage);

        const safeMessage = sanitizeErrorForStorage(rawMessage);

        // Mark as error so UI can show it
        await supabase
          .from('providers')
          .update({ status: 'error', last_error: safeMessage })
          .eq('id', data.id);

        finalStatus = 'error';
        syncResult.error = sanitizeErrorForClient(rawMessage);
      }
    }

    return NextResponse.json({
      success: true,
      provider: {
        id: data.id,
        provider: data.provider,
        display_name: data.display_name,
        status: finalStatus,
      },
      sync: syncResult,
    });
  } catch (error) {
    console.error('Error saving provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
