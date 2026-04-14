import { createAdminClient } from '@/lib/supabase/admin';
import { decryptFromDB } from '@/lib/crypto';
import { getAdapter } from '@/lib/providers/registry';
import { pulseMetric } from '@/lib/saas-pulse';
import type { ProviderType } from '@/types';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Poll usage data from all active providers.
 * Fetches last 2 days of data (overlap to catch late arrivals).
 */
export async function runPollUsage(): Promise<{
  polled: number;
  succeeded: number;
  failed: number;
}> {
  const supabase = createAdminClient();

  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, user_id, provider, api_key_encrypted, api_key_iv, api_key_tag')
    .eq('status', 'active');

  if (error) throw new Error(`DB error fetching providers: ${error.message}`);

  const providerList = providers ?? [];
  if (providerList.length === 0) {
    return { polled: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  let totalRecords = 0;

  for (const provider of providerList) {
    try {
      const adapter = getAdapter(provider.provider as ProviderType);
      const apiKey = decryptFromDB({
        api_key_encrypted: provider.api_key_encrypted,
        api_key_iv: provider.api_key_iv,
        api_key_tag: provider.api_key_tag,
      });

      const startDate = daysAgo(2);
      const endDate = endOfToday();
      const records = await adapter.fetchUsage(apiKey, startDate, endDate);

      if (records.length > 0) {
        const rows = records.map((r) => ({
          provider_id: provider.id,
          user_id: provider.user_id,
          date: r.date,
          model: r.model,
          input_tokens: r.inputTokens,
          output_tokens: r.outputTokens,
          requests: r.requests,
          cost_usd: r.costUsd,
        }));

        const { error: upsertError } = await supabase
          .from('usage_records')
          .upsert(rows, {
            onConflict: 'provider_id,date,model',
            ignoreDuplicates: false,
          });

        if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`);
        totalRecords += records.length;
      }

      await supabase
        .from('providers')
        .update({ last_sync_at: new Date().toISOString(), status: 'active' })
        .eq('id', provider.id);

      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isDecryptionError =
        message.includes('Encryption data incomplete') ||
        message.includes('invalid format') ||
        message.includes('Unsupported state');
      console.error(
        `[poll-usage] Provider ${provider.id} failed:`,
        message,
        isDecryptionError ? '(needs re-keying)' : '',
      );

      await supabase
        .from('providers')
        .update({
          status: 'error',
          last_error: message.slice(0, 500),
        })
        .eq('id', provider.id);

      failed++;
    }
  }

  pulseMetric('providers_polled', providerList.length);
  pulseMetric('usage_records_synced', totalRecords);
  if (failed > 0) pulseMetric('provider_sync_errors', failed);

  return { polled: providerList.length, succeeded, failed };
}
