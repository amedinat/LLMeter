import { createAdminClient } from '@/lib/supabase/admin';
import { sendDailyDigestEmail } from '@/lib/email/send-digest';

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any;

interface DigestRow {
  user_id: string;
  yesterdaySpend: number;
  sevenDayAvg: number;
  topModels: { model: string; provider: string; cost: number }[];
  plan: string;
}

async function buildDigestForUser(
  supabase: SupabaseAdmin,
  userId: string,
  yesterday: string,
  sevenDaysAgoStr: string,
): Promise<DigestRow | null> {
  // Yesterday's total
  const { data: yesterdayRecords, error: e1 } = await supabase
    .from('usage_records')
    .select('cost_usd')
    .eq('user_id', userId)
    .eq('date', yesterday);

  if (e1) {
    console.warn(`[daily-digest] Failed to query yesterday for ${userId}:`, e1.message);
    return null;
  }

  const yesterdaySpend = (yesterdayRecords ?? []).reduce(
    (sum: number, r: { cost_usd: number }) => sum + (r.cost_usd ?? 0),
    0,
  );

  // Skip users with zero spend yesterday — no useful digest to send
  if (yesterdaySpend === 0) return null;

  // 7-day average (excluding yesterday to show true trend)
  const weekStart = dateString(daysAgo(8)); // 8 days ago
  const { data: weekRecords } = await supabase
    .from('usage_records')
    .select('date, cost_usd')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lt('date', yesterday);

  const dailyTotals: Record<string, number> = {};
  for (const r of weekRecords ?? []) {
    dailyTotals[r.date] = (dailyTotals[r.date] ?? 0) + (r.cost_usd ?? 0);
  }
  const dayValues = Object.values(dailyTotals);
  const sevenDayAvg =
    dayValues.length > 0
      ? dayValues.reduce((s, v) => s + v, 0) / dayValues.length
      : 0;

  // Top models yesterday
  const { data: topModelRecords } = await supabase
    .from('usage_records')
    .select('model, cost_usd, providers!inner(provider)')
    .eq('user_id', userId)
    .eq('date', yesterday)
    .order('cost_usd', { ascending: false })
    .limit(5);

  const topModels = (topModelRecords ?? []).map(
    (r: { model: string; cost_usd: number; providers: unknown }) => ({
      model: r.model,
      provider: (r.providers as { provider: string })?.provider ?? 'unknown',
      cost: r.cost_usd ?? 0,
    }),
  );

  // User plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = profile?.plan ?? 'free';

  // Suppress unused variable warning
  void sevenDaysAgoStr;

  return { user_id: userId, yesterdaySpend, sevenDayAvg, topModels, plan };
}

/**
 * Send daily usage digest emails to all users who had LLM spend yesterday.
 */
export async function runDailyDigest(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
}> {
  const supabase = createAdminClient();

  const yesterday = dateString(daysAgo(1));
  const sevenDaysAgoStr = dateString(daysAgo(8));

  // Find users with usage yesterday (distinct user_ids)
  const { data: activeUsers, error } = await supabase
    .from('usage_records')
    .select('user_id')
    .eq('date', yesterday);

  if (error) throw new Error(`DB error querying active users: ${error.message}`);

  const uniqueUserIds = [...new Set((activeUsers ?? []).map((r: { user_id: string }) => r.user_id))];

  if (uniqueUserIds.length === 0) {
    return { processed: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const userId of uniqueUserIds) {
    try {
      const digest = await buildDigestForUser(supabase, userId, yesterday, sevenDaysAgoStr);
      if (!digest) {
        skipped++;
        continue;
      }

      // Look up user email
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.admin.getUserById(userId);

      if (userErr || !user?.email) {
        console.warn(`[daily-digest] Could not resolve email for ${userId}`);
        skipped++;
        continue;
      }

      const ok = await sendDailyDigestEmail({
        email: user.email,
        yesterdaySpend: digest.yesterdaySpend,
        sevenDayAvg: digest.sevenDayAvg,
        topModels: digest.topModels,
        date: formatDate(yesterday),
        isProUser: digest.plan !== 'free',
      });

      if (ok) {
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.warn(`[daily-digest] Failed for user ${userId}:`, err);
      skipped++;
    }
  }

  return { processed: uniqueUserIds.length, sent, skipped };
}
