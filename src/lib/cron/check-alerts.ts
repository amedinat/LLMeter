import { createAdminClient } from '@/lib/supabase/admin';
import { sendAlertEmail } from '@/lib/email/send-alert';
import { pulseTrack } from '@/lib/saas-pulse';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

async function triggerAlert(
  supabase: SupabaseAdmin,
  alert: { id: string; user_id: string; config: unknown },
  currentValue: number,
  referenceValue: number,
  alertType: 'monthly' | 'daily' | 'anomaly',
  startDate: string
) {
  const { data: contributors } = await supabase
    .from('usage_records')
    .select('model, cost_usd, providers!inner(provider)')
    .eq('user_id', alert.user_id)
    .gte('date', startDate)
    .order('cost_usd', { ascending: false })
    .limit(5);

  const topContributors = (contributors ?? []).map((c: { model: string; cost_usd: number; providers: unknown }) => ({
    model: c.model,
    provider: (c.providers as { provider: string })?.provider ?? 'unknown',
    cost: c.cost_usd ?? 0,
  }));

  const message =
    alertType === 'anomaly'
      ? `Anomaly detected: today's spend ($${currentValue.toFixed(2)}) is significantly above average ($${referenceValue.toFixed(2)})`
      : `${alertType === 'monthly' ? 'Monthly' : 'Daily'} spend ($${currentValue.toFixed(2)}) exceeded threshold ($${referenceValue.toFixed(2)})`;

  await supabase.from('alert_events').insert({
    alert_id: alert.id,
    user_id: alert.user_id,
    message,
    data: { currentValue, referenceValue, alertType },
  });

  await supabase
    .from('alerts')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', alert.id);

  pulseTrack('alert_triggered', {
    user_ref: alert.user_id,
    metadata: { alertType, currentValue, referenceValue },
  });

  await sendAlertEmail({
    userId: alert.user_id,
    alertType: alertType === 'anomaly' ? 'daily' : alertType,
    currentSpend: currentValue,
    threshold: referenceValue,
    topContributors,
  });
}

/**
 * Check all enabled alerts and trigger those that exceed thresholds.
 */
export async function runCheckAlerts(): Promise<{
  checked: number;
  triggered: number;
}> {
  const supabase = createAdminClient();

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('enabled', true);

  if (error) throw new Error(`DB error: ${error.message}`);

  const alertList = alerts ?? [];
  if (alertList.length === 0) {
    return { checked: 0, triggered: 0 };
  }

  let triggered = 0;

  for (const alert of alertList) {
    try {
      const config = alert.config as {
        threshold: number;
        period: 'daily' | 'monthly';
        providers?: string[];
      };

      // Don't re-trigger within 24h
      if (alert.last_triggered_at) {
        const lastTriggered = new Date(alert.last_triggered_at).getTime();
        const hoursSince = (Date.now() - lastTriggered) / (1000 * 60 * 60);
        if (hoursSince < 24) continue;
      }

      const now = new Date();
      const today = now.toISOString().slice(0, 10);

      // --- Anomaly detection (z-score) ---
      if (alert.type === 'anomaly') {
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
          console.warn(`[check-alerts] Anomaly alert ${alert.id} query failed:`, histErr.message);
          continue;
        }

        const dailyTotals: Record<string, number> = {};
        for (const r of historyRecords ?? []) {
          dailyTotals[r.date] = (dailyTotals[r.date] ?? 0) + (r.cost_usd ?? 0);
        }

        const todaySpend = dailyTotals[today] ?? 0;
        const pastDays = Object.entries(dailyTotals)
          .filter(([d]) => d !== today)
          .map(([, v]) => v);

        if (pastDays.length < 3) continue;

        const mean = pastDays.reduce((s, v) => s + v, 0) / pastDays.length;
        const variance = pastDays.reduce((s, v) => s + (v - mean) ** 2, 0) / pastDays.length;
        const stdDev = Math.sqrt(variance);
        const zThreshold = config.threshold > 0 ? config.threshold : 2.0;
        const zScore = stdDev > 0 ? (todaySpend - mean) / stdDev : 0;

        if (zScore >= zThreshold) {
          await triggerAlert(supabase, alert, todaySpend, mean, 'anomaly', today);
          triggered++;
        }
        continue;
      }

      // --- Budget limit / Daily threshold ---
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

      const { data: records, error: qErr } = await query;
      if (qErr) {
        console.warn(`[check-alerts] Alert ${alert.id} query failed:`, qErr.message);
        continue;
      }

      const totalSpend = (records ?? []).reduce(
        (sum, r) => sum + (r.cost_usd ?? 0),
        0
      );

      if (totalSpend >= config.threshold) {
        await triggerAlert(supabase, alert, totalSpend, config.threshold, config.period === 'monthly' ? 'monthly' : 'daily', startDate);
        triggered++;
      }
    } catch (err) {
      console.warn(`[check-alerts] Failed to evaluate alert ${alert.id}:`, err);
    }
  }

  return { checked: alertList.length, triggered };
}
