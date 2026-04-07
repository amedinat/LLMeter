import { createAdminClient } from '@/lib/supabase/admin';
import { sendGracePeriodEndingEmail } from '@/lib/email/send-billing';
import { PLANS } from '@/config/plans';

/**
 * Expire grace periods for failed payments and send warning emails.
 * Replaces Inngest expireGracePeriods function.
 */
export async function runExpireGracePeriods(): Promise<{
  warned: number;
  expired: number;
}> {
  const supabase = createAdminClient();
  const now = new Date();

  // Step 1: Warn users whose grace period ends within 2 days
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const { data: gracingUsers } = await supabase
    .from('profiles')
    .select('id, plan, current_period_end')
    .eq('payment_issue', true)
    .gt('current_period_end', now.toISOString())
    .lte('current_period_end', twoDaysFromNow.toISOString())
    .neq('plan', 'free');

  let warned = 0;
  for (const profile of gracingUsers ?? []) {
    try {
      const graceEnd = new Date(profile.current_period_end);
      const daysLeft = Math.max(
        1,
        Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const planConfig = PLANS[profile.plan as keyof typeof PLANS];
      const sent = await sendGracePeriodEndingEmail({
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        daysLeft,
        graceEndDate: graceEnd.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        plan: planConfig?.label ?? profile.plan,
      });
      if (sent) warned++;
    } catch (err) {
      console.warn(`[expire-grace] Warning email failed for ${profile.id}:`, err);
    }
  }

  // Step 2: Downgrade users whose grace period has expired
  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('payment_issue', true)
    .lte('current_period_end', now.toISOString())
    .neq('plan', 'free');

  let expired = 0;
  for (const profile of expiredUsers ?? []) {
    await supabase
      .from('profiles')
      .update({
        plan: 'free',
        plan_status: 'free',
        payment_issue: false,
        paddle_subscription_id: null,
        current_period_end: null,
        trial_ends_at: null,
      })
      .eq('id', profile.id);
    expired++;
  }

  console.log(`[expire-grace] ${warned} warnings sent, ${expired} accounts downgraded`);
  return { warned, expired };
}
