import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptFromDB } from '@/lib/crypto';
import { getAdapter } from '@/lib/providers/registry';
import { sendAlertEmail } from '@/lib/email/send-alert';
import type { ProviderType } from '@/types';

// ----- Helpers -----

/** Get date N days ago as YYYY-MM-DD */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Today at 23:59:59 UTC */
function endOfToday(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

/** Trigger an alert: record event, update timestamp, send email */
async function triggerAlert(
  supabase: SupabaseAdmin,
  alert: { id: string; user_id: string; config: unknown },
  currentValue: number,
  referenceValue: number,
  alertType: 'monthly' | 'daily' | 'anomaly',
  startDate: string
) {
  const config = alert.config as { threshold: number; period: string };

  // Fetch top contributors
  const { data: contributors } = await supabase
    .from('usage_records')
    .select('model, cost_usd, providers!inner(provider)')
    .eq('user_id', alert.user_id)
    .gte('date', startDate)
    .order('cost_usd', { ascending: false })
    .limit(5);

  const topContributors = (contributors ?? []).map((c: { model: string; cost_usd: number; providers: unknown }) => ({
    model: c.model,
    provider:
      (c.providers as { provider: string })?.provider ?? 'unknown',
    cost: c.cost_usd ?? 0,
  }));

  const message =
    alertType === 'anomaly'
      ? `Anomaly detected: today's spend ($${currentValue.toFixed(2)}) is significantly above average ($${referenceValue.toFixed(2)})`
      : `${alertType === 'monthly' ? 'Monthly' : 'Daily'} spend ($${currentValue.toFixed(2)}) exceeded threshold ($${referenceValue.toFixed(2)})`;

  // Record the alert event
  await supabase.from('alert_events').insert({
    alert_id: alert.id,
    user_id: alert.user_id,
    message,
    data: { currentValue, referenceValue, alertType },
  });

  // Update last_triggered_at
  await supabase
    .from('alerts')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', alert.id);

  // Send email notification
  await sendAlertEmail({
    userId: alert.user_id,
    alertType: alertType === 'anomaly' ? 'daily' : alertType,
    currentSpend: currentValue,
    threshold: referenceValue,
    topContributors,
  });
}

// ----- Functions -----

/**
 * Polls usage data from all active providers.
 * Runs every hour via Inngest cron.
 *
 * Flow:
 * 1. Fetch all providers with status='active'
 * 2. For each, decrypt API key, call adapter.fetchUsage()
 * 3. Upsert normalized records into usage_records
 * 4. Update provider.last_sync_at
 * 5. On error, set provider.status='error'
 */
export const pollUsage = inngest.createFunction(
  { id: 'poll-usage', name: 'Poll Provider Usage Data' },
  { cron: '0 * * * *' },
  async ({ step, logger }) => {
    const supabase = createAdminClient();

    // Step 1: Fetch active providers
    const providers = await step.run('fetch-active-providers', async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('id, user_id, provider, api_key_encrypted, api_key_iv, api_key_tag')
        .eq('status', 'active');

      if (error) throw new Error(`DB error fetching providers: ${error.message}`);
      return data ?? [];
    });

    if (providers.length === 0) {
      logger.info('No active providers to poll');
      return { polled: 0 };
    }

    // Step 2: Poll each provider (each as its own step for retryability)
    const results: { providerId: string; records: number; error?: string }[] = [];

    for (const provider of providers) {
      const result = await step.run(
        `poll-${provider.id}`,
        async () => {
          try {
            const adapter = getAdapter(provider.provider as ProviderType);

            // Decrypt API key
            const apiKey = decryptFromDB({
              api_key_encrypted: provider.api_key_encrypted,
              api_key_iv: provider.api_key_iv,
              api_key_tag: provider.api_key_tag,
            });

            // Fetch last 2 days (overlap to catch late-arriving data)
            const startDate = daysAgo(2);
            const endDate = endOfToday();

            const records = await adapter.fetchUsage(apiKey, startDate, endDate);

            if (records.length > 0) {
              // Upsert into usage_records
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

              if (upsertError) {
                throw new Error(`Upsert failed: ${upsertError.message}`);
              }
            }

            // Update last_sync_at
            await supabase
              .from('providers')
              .update({ last_sync_at: new Date().toISOString(), status: 'active' })
              .eq('id', provider.id);

            return { providerId: provider.id, records: records.length };
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);

            // Mark provider as error
            await supabase
              .from('providers')
              .update({ status: 'error' })
              .eq('id', provider.id);

            return { providerId: provider.id, records: 0, error: message };
          }
        }
      );

      results.push(result);
    }

    const succeeded = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;

    logger.info(`Poll complete: ${succeeded} OK, ${failed} errors`);
    return { polled: providers.length, succeeded, failed, details: results };
  }
);

/**
 * Checks alerts for all users after usage data is updated.
 * Runs every 6 hours.
 *
 * For each enabled alert:
 * - Budget limit: sum usage for the period, compare to threshold
 * - Daily threshold: check today's spend vs threshold
 * - Anomaly: compare today's spend to 7-day moving average (z-score > 2)
 */
export const checkAlerts = inngest.createFunction(
  { id: 'check-alerts', name: 'Check Budget Alerts' },
  { cron: '0 */6 * * *' },
  async ({ step, logger }) => {
    const supabase = createAdminClient();

    const alerts = await step.run('fetch-enabled-alerts', async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('enabled', true);

      if (error) throw new Error(`DB error: ${error.message}`);
      return data ?? [];
    });

    if (alerts.length === 0) {
      logger.info('No enabled alerts');
      return { checked: 0, triggered: 0 };
    }

    let triggered = 0;

    for (const alert of alerts) {
      const wasTriggered = await step.run(`check-alert-${alert.id}`, async () => {
        const config = alert.config as {
          threshold: number;
          period: 'daily' | 'monthly';
          providers?: string[];
        };

        // Don't re-trigger within 24h
        if (alert.last_triggered_at) {
          const lastTriggered = new Date(alert.last_triggered_at).getTime();
          const hoursSince = (Date.now() - lastTriggered) / (1000 * 60 * 60);
          if (hoursSince < 24) return false;
        }

        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        // ----- Anomaly detection (z-score) -----
        if (alert.type === 'anomaly') {
          // Get last 14 days of daily totals
          const lookbackDate = daysAgo(14).toISOString().slice(0, 10);

          let historyQuery = supabase
            .from('usage_records')
            .select('date, cost_usd')
            .eq('user_id', alert.user_id)
            .gte('date', lookbackDate);

          if (config.providers && config.providers.length > 0) {
            historyQuery = historyQuery.in('provider_id', config.providers);
          }

          const { data: historyRecords, error: histErr } = await historyQuery;
          if (histErr) {
            logger.warn(`Anomaly alert ${alert.id} query failed: ${histErr.message}`);
            return false;
          }

          // Aggregate by day
          const dailyTotals: Record<string, number> = {};
          for (const r of historyRecords ?? []) {
            dailyTotals[r.date] = (dailyTotals[r.date] ?? 0) + (r.cost_usd ?? 0);
          }

          const todaySpend = dailyTotals[today] ?? 0;
          const pastDays = Object.entries(dailyTotals)
            .filter(([d]) => d !== today)
            .map(([, v]) => v);

          if (pastDays.length < 3) return false; // Not enough history

          const mean = pastDays.reduce((s, v) => s + v, 0) / pastDays.length;
          const variance = pastDays.reduce((s, v) => s + (v - mean) ** 2, 0) / pastDays.length;
          const stdDev = Math.sqrt(variance);

          // z-score threshold: default 2.0, or use config.threshold as multiplier
          const zThreshold = config.threshold > 0 ? config.threshold : 2.0;
          const zScore = stdDev > 0 ? (todaySpend - mean) / stdDev : 0;

          if (zScore >= zThreshold) {
            await triggerAlert(supabase, alert, todaySpend, mean, 'anomaly', today);
            return true;
          }

          return false;
        }

        // ----- Budget limit / Daily threshold -----
        let startDate: string;
        if (config.period === 'monthly') {
          startDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
        } else {
          startDate = today;
        }

        let query = supabase
          .from('usage_records')
          .select('cost_usd')
          .eq('user_id', alert.user_id)
          .gte('date', startDate);

        if (config.providers && config.providers.length > 0) {
          query = query.in('provider_id', config.providers);
        }

        const { data: records, error } = await query;
        if (error) {
          logger.warn(`Alert ${alert.id} query failed: ${error.message}`);
          return false;
        }

        const totalSpend = (records ?? []).reduce(
          (sum, r) => sum + (r.cost_usd ?? 0),
          0
        );

        if (totalSpend >= config.threshold) {
          await triggerAlert(
            supabase,
            alert,
            totalSpend,
            config.threshold,
            config.period === 'monthly' ? 'monthly' : 'daily',
            startDate
          );
          return true;
        }

        return false;
      });

      if (wasTriggered) triggered++;
    }

    logger.info(`Alerts checked: ${alerts.length}, triggered: ${triggered}`);
    return { checked: alerts.length, triggered };
  }
);

/**
 * Syncs usage data for a newly connected provider.
 * Triggered by event when user adds a provider.
 * Pulls last 30 days of data for immediate value.
 */
export const syncNewProvider = inngest.createFunction(
  {
    id: 'sync-new-provider',
    name: 'Sync New Provider Data',
    retries: 3,
  },
  { event: 'provider/connected' },
  async ({ event, step, logger }) => {
    const { providerId, userId } = event.data as {
      providerId: string;
      userId: string;
    };

    const supabase = createAdminClient();

    // Mark as syncing
    await step.run('mark-syncing', async () => {
      await supabase
        .from('providers')
        .update({ status: 'syncing' })
        .eq('id', providerId);
    });

    // Fetch provider details and decrypt key
    const providerData = await step.run('fetch-provider', async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('provider, api_key_encrypted, api_key_iv, api_key_tag')
        .eq('id', providerId)
        .single();

      if (error || !data) throw new Error(`Provider not found: ${providerId}`);
      return data;
    });

    // Pull last 30 days
    const result = await step.run('initial-sync', async () => {
      try {
        const adapter = getAdapter(providerData.provider as ProviderType);
        const apiKey = decryptFromDB({
          api_key_encrypted: providerData.api_key_encrypted,
          api_key_iv: providerData.api_key_iv,
          api_key_tag: providerData.api_key_tag,
        });

        const startDate = daysAgo(30);
        const endDate = endOfToday();
        const records = await adapter.fetchUsage(apiKey, startDate, endDate);

        if (records.length > 0) {
          const rows = records.map((r) => ({
            provider_id: providerId,
            user_id: userId,
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
        }

        // Mark as active
        await supabase
          .from('providers')
          .update({ status: 'active', last_sync_at: new Date().toISOString() })
          .eq('id', providerId);

        return { records: records.length, status: 'success' };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        await supabase
          .from('providers')
          .update({ status: 'error' })
          .eq('id', providerId);

        throw new Error(`Initial sync failed: ${message}`);
      }
    });

    logger.info(`New provider ${providerId} synced: ${result.records} records`);
    return result;
  }
);
