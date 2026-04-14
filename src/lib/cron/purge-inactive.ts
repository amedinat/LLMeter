import { createAdminClient } from '@/lib/supabase/admin';
import { sendDataPurgeWarningEmail } from '@/lib/email/send-billing';

const WARN_AFTER_DAYS = 30;
const PURGE_AFTER_DAYS = 45;

/**
 * Purge usage data for inactive free-plan users.
 *
 * Policy:
 * - After 30 days of inactivity → send warning email
 * - After 45 days of inactivity → delete usage_records & customer_usage_records
 * - Account (profile) stays intact so users can come back
 */
export async function runPurgeInactive(): Promise<{
  warned: number;
  purged: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();

  const warnCutoff = new Date(now);
  warnCutoff.setDate(warnCutoff.getDate() - WARN_AFTER_DAYS);

  const purgeCutoff = new Date(now);
  purgeCutoff.setDate(purgeCutoff.getDate() - PURGE_AFTER_DAYS);

  // ── Step 1: Warn free users inactive for 30+ days (not yet warned) ──

  const { data: usersToWarn } = await supabase
    .from('profiles')
    .select('id, last_seen_at')
    .eq('plan', 'free')
    .lte('last_seen_at', warnCutoff.toISOString())
    .gt('last_seen_at', purgeCutoff.toISOString())
    .is('purge_warned_at', null);

  let warned = 0;
  for (const profile of usersToWarn ?? []) {
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
    if (!user?.email) continue;

    const lastSeen = new Date(profile.last_seen_at);
    const purgeDate = new Date(lastSeen);
    purgeDate.setDate(purgeDate.getDate() + PURGE_AFTER_DAYS);

    const daysLeft = Math.max(
      1,
      Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const sent = await sendDataPurgeWarningEmail({
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      daysLeft,
      purgeDate: purgeDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    });

    if (sent) {
      await supabase
        .from('profiles')
        .update({ purge_warned_at: now.toISOString() })
        .eq('id', profile.id);
      warned++;
    }
  }

  // ── Step 2: Purge data for free users inactive for 45+ days ──

  const { data: usersToPurge } = await supabase
    .from('profiles')
    .select('id')
    .eq('plan', 'free')
    .lte('last_seen_at', purgeCutoff.toISOString());

  let purged = 0;
  for (const profile of usersToPurge ?? []) {
    // Delete usage records
    const { error: usageErr } = await supabase
      .from('usage_records')
      .delete()
      .eq('user_id', profile.id);

    // Delete customer usage records
    const { error: customerErr } = await supabase
      .from('customer_usage_records')
      .delete()
      .eq('user_id', profile.id);

    if (usageErr) {
      console.error(`[purge-inactive] Failed to delete usage_records for ${profile.id}:`, usageErr.message);
      continue;
    }
    if (customerErr) {
      console.error(`[purge-inactive] Failed to delete customer_usage_records for ${profile.id}:`, customerErr.message);
    }

    // Reset purge_warned_at so if they come back and go inactive again, the cycle restarts
    await supabase
      .from('profiles')
      .update({ purge_warned_at: null })
      .eq('id', profile.id);

    purged++;
  }

  console.log(`[purge-inactive] ${warned} warnings sent, ${purged} accounts purged`);
  return { warned, purged };
}
