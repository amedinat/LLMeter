import { createAdminClient } from '@/lib/supabase/admin';
import { sendAlertEmail } from '@/lib/email/send-alert';

/**
 * Evaluate alerts inline after a sync completes.
 * Evaluates alerts after a provider sync completes.
 * Should be called after usage data is upserted for a provider.
 *
 * @param userId - The user whose alerts to check
 */
export async function evaluateAlertsInline(userId: string): Promise<{
  checked: number;
  triggered: number;
}> {
  const supabase = createAdminClient();

  // Fetch enabled alerts for this user
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true);

  if (error || !alerts || alerts.length === 0) {
    return { checked: 0, triggered: 0 };
  }

  let triggered = 0;

  for (const alert of alerts) {
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
        const lookbackDate = new Date();
        lookbackDate.setUTCDate(lookbackDate.getUTCDate() - 14);
        const lookbackStr = lookbackDate.toISOString().slice(0, 10);

        let historyQuery = supabase
          .from('usage_records')
          .select('date, cost_usd')
          .eq('user_id', userId)
          .gte('date', lookbackStr);

        if (config.providers && config.providers.length > 0) {
          historyQuery = historyQuery.in('provider_id', config.providers);
        }

        const { data: historyRecords } = await historyQuery;

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
          await fireAlert(supabase, alert, todaySpend, mean, 'anomaly', today, userId);
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
        .eq('user_id', userId)
        .gte('date', startDate);

      if (config.providers && config.providers.length > 0) {
        query = query.in('provider_id', config.providers);
      }

      const { data: records } = await query;

      const totalSpend = (records ?? []).reduce(
        (sum, r) => sum + (r.cost_usd ?? 0),
        0
      );

      if (totalSpend >= config.threshold) {
        await fireAlert(
          supabase,
          alert,
          totalSpend,
          config.threshold,
          config.period === 'monthly' ? 'monthly' : 'daily',
          startDate,
          userId
        );
        triggered++;
      }
    } catch (err) {
      console.warn(`[alerts] Failed to evaluate alert ${alert.id}:`, err);
    }
  }

  return { checked: alerts.length, triggered };
}

async function fireAlert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  alert: { id: string; user_id: string; config: unknown },
  currentValue: number,
  referenceValue: number,
  alertType: 'monthly' | 'daily' | 'anomaly',
  startDate: string,
  userId: string
) {
  const message =
    alertType === 'anomaly'
      ? `Anomaly detected: today's spend ($${currentValue.toFixed(2)}) is significantly above average ($${referenceValue.toFixed(2)})`
      : `${alertType === 'monthly' ? 'Monthly' : 'Daily'} spend ($${currentValue.toFixed(2)}) exceeded threshold ($${referenceValue.toFixed(2)})`;

  // Fetch top contributors
  const { data: contributors } = await supabase
    .from('usage_records')
    .select('model, cost_usd, providers!inner(provider)')
    .eq('user_id', userId)
    .gte('date', startDate)
    .order('cost_usd', { ascending: false })
    .limit(5);

  const topContributors = (contributors ?? []).map((c: { model: string; cost_usd: number; providers: unknown }) => ({
    model: c.model,
    provider: (c.providers as { provider: string })?.provider ?? 'unknown',
    cost: c.cost_usd ?? 0,
  }));

  // Record the alert event
  await supabase.from('alert_events').insert({
    alert_id: alert.id,
    user_id: userId,
    message,
    data: { currentValue, referenceValue, alertType },
  });

  // Update last_triggered_at
  await supabase
    .from('alerts')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', alert.id);

  // Send email (best effort)
  try {
    await sendAlertEmail({
      userId,
      alertType: alertType === 'anomaly' ? 'daily' : alertType,
      currentSpend: currentValue,
      threshold: referenceValue,
      topContributors,
    });
  } catch (emailErr) {
    console.warn(`[alerts] Email send failed for alert ${alert.id}:`, emailErr);
  }
}
