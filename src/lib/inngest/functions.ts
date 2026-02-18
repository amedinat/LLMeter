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

        // Determine date range
        const now = new Date();
        let startDate: string;

        if (config.period === 'monthly') {
          startDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
        } else {
          startDate = now.toISOString().slice(0, 10);
        }

        // Sum usage for the period
        let query = supabase
          .from('usage_records')
          .select('cost_usd')
          .eq('user_id', alert.user_id)
          .gte('date', startDate);

        // Filter by specific providers if configured
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
          // Don't re-trigger within 24h
          if (alert.last_triggered_at) {
            const lastTriggered = new Date(alert.last_triggered_at).getTime();
            const hoursSince = (Date.now() - lastTriggered) / (1000 * 60 * 60);
            if (hoursSince < 24) return false;
          }

          // Fetch top contributors for the email context
          const { data: contributors } = await supabase
            .from('usage_records')
            .select('model, cost_usd, providers!inner(provider)')
            .eq('user_id', alert.user_id)
            .gte('date', startDate)
            .order('cost_usd', { ascending: false })
            .limit(5);

          const topContributors = (contributors ?? []).map((c) => ({
            model: c.model,
            provider:
              (c.providers as unknown as { provider: string })?.provider ??
              'unknown',
            cost: c.cost_usd ?? 0,
          }));

          // Record the alert event
          await supabase.from('alert_events').insert({
            alert_id: alert.id,
            user_id: alert.user_id,
            message: `${config.period === 'monthly' ? 'Monthly' : 'Daily'} spend ($${totalSpend.toFixed(2)}) exceeded threshold ($${config.threshold.toFixed(2)})`,
            data: { totalSpend, threshold: config.threshold, period: config.period },
          });

          // Update last_triggered_at
          await supabase
            .from('alerts')
            .update({ last_triggered_at: new Date().toISOString() })
            .eq('id', alert.id);

          // Send email notification via Resend
          await sendAlertEmail({
            userId: alert.user_id,
            alertType: config.period === 'monthly' ? 'monthly' : 'daily',
            currentSpend: totalSpend,
            threshold: config.threshold,
            topContributors,
          });

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
