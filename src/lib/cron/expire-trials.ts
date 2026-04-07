import { createAdminClient } from '@/lib/supabase/admin';
import { sendTrialExpiringEmail } from '@/lib/email/send-billing';

/**
 * Expire trials that have ended.
 * Warns users 2 days before, downgrades to free if no subscription.
 */
export async function runExpireTrials(): Promise<{
  warned: number;
  expired: number;
}> {
  const supabase = createAdminClient();

  // Step 1: Warn users whose trial ends within 2 days
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const now = new Date();

  const { data: expiringUsers } = await supabase
    .from('profiles')
    .select('id, plan, trial_ends_at')
    .not('trial_ends_at', 'is', null)
    .gt('trial_ends_at', now.toISOString())
    .lte('trial_ends_at', twoDaysFromNow.toISOString())
    .neq('plan', 'free');

  let warned = 0;
  for (const profile of expiringUsers ?? []) {
    const trialEnd = new Date(profile.trial_ends_at);
    const daysLeft = Math.max(1, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
    if (!user?.email) continue;

    const sent = await sendTrialExpiringEmail({
      email: user.email,
      name: user.user_metadata?.full_name || user.email.split('@')[0],
      daysLeft,
      trialEndDate: trialEnd.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    });
    if (sent) warned++;
  }

  // Step 2: Downgrade users whose trial has expired
  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('id, plan, trial_ends_at, paddle_subscription_id')
    .not('trial_ends_at', 'is', null)
    .lte('trial_ends_at', now.toISOString())
    .neq('plan', 'free');

  let expired = 0;
  for (const profile of expiredUsers ?? []) {
    if (profile.paddle_subscription_id) {
      await supabase
        .from('profiles')
        .update({ trial_ends_at: null })
        .eq('id', profile.id);
      continue;
    }

    await supabase
      .from('profiles')
      .update({
        plan: 'free',
        plan_status: 'free',
        trial_ends_at: null,
        current_period_end: null,
      })
      .eq('id', profile.id);
    expired++;
  }

  console.log(`[expire-trials] ${warned} warnings sent, ${expired} accounts downgraded`);
  return { warned, expired };
}
