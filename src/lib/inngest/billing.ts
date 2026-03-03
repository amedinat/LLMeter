import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendTrialExpiringEmail, sendGracePeriodEndingEmail } from '@/lib/email/send-billing';
import { PLANS } from '@/config/plans';

/**
 * Daily cron: expire trials that have ended.
 *
 * Finds users with trial_ends_at in the past who still have a paid plan,
 * then checks their Stripe subscription status. If the subscription is not
 * active (i.e. no payment method was added), downgrades to free.
 *
 * Also sends warning emails 2 days and 1 day before trial ends.
 */
export const expireTrials = inngest.createFunction(
  { id: 'expire-trials', name: 'Expire Trials' },
  { cron: '0 6 * * *' }, // daily at 6am UTC
  async ({ step, logger }) => {
    const supabase = createAdminClient();

    // Step 1: Send warning emails to users whose trial ends within 2 days
    const warned = await step.run('warn-expiring-trials', async () => {
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

      let emailsSent = 0;
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
        if (sent) emailsSent++;
      }

      return emailsSent;
    });

    // Step 2: Downgrade users whose trial has expired
    const expired = await step.run('downgrade-expired-trials', async () => {
      const now = new Date();

      const { data: expiredUsers } = await supabase
        .from('profiles')
        .select('id, plan, trial_ends_at, stripe_subscription_id')
        .not('trial_ends_at', 'is', null)
        .lte('trial_ends_at', now.toISOString())
        .neq('plan', 'free');

      let downgraded = 0;
      for (const profile of expiredUsers ?? []) {
        // If they have an active subscription (payment method added during trial),
        // just clear the trial flag — Stripe webhook will handle the rest
        if (profile.stripe_subscription_id) {
          await supabase
            .from('profiles')
            .update({ trial_ends_at: null })
            .eq('id', profile.id);
          continue;
        }

        // No subscription → downgrade to free
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            plan_status: 'free',
            trial_ends_at: null,
            current_period_end: null,
          })
          .eq('id', profile.id);
        downgraded++;
      }

      return downgraded;
    });

    logger.info(`Trial check: ${warned} warnings sent, ${expired} accounts downgraded`);
    return { warned, expired };
  },
);

/**
 * Daily cron: expire grace periods for failed payments.
 *
 * Finds users with payment_issue=true whose current_period_end has passed.
 * Downgrades them to the free plan.
 *
 * Also sends warning emails 2 days before grace period ends.
 */
export const expireGracePeriods = inngest.createFunction(
  { id: 'expire-grace-periods', name: 'Expire Grace Periods' },
  { cron: '0 7 * * *' }, // daily at 7am UTC
  async ({ step, logger }) => {
    const supabase = createAdminClient();

    // Step 1: Warn users whose grace period ends within 2 days
    const warned = await step.run('warn-grace-ending', async () => {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      const now = new Date();

      const { data: gracingUsers } = await supabase
        .from('profiles')
        .select('id, plan, current_period_end')
        .eq('payment_issue', true)
        .gt('current_period_end', now.toISOString())
        .lte('current_period_end', twoDaysFromNow.toISOString())
        .neq('plan', 'free');

      let emailsSent = 0;
      for (const profile of gracingUsers ?? []) {
        const graceEnd = new Date(profile.current_period_end);
        const daysLeft = Math.max(1, Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
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
        if (sent) emailsSent++;
      }

      return emailsSent;
    });

    // Step 2: Downgrade users whose grace period has expired
    const expired = await step.run('downgrade-expired-grace', async () => {
      const now = new Date();

      const { data: expiredUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('payment_issue', true)
        .lte('current_period_end', now.toISOString())
        .neq('plan', 'free');

      let downgraded = 0;
      for (const profile of expiredUsers ?? []) {
        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            plan_status: 'free',
            payment_issue: false,
            stripe_subscription_id: null,
            current_period_end: null,
            trial_ends_at: null,
          })
          .eq('id', profile.id);
        downgraded++;
      }

      return downgraded;
    });

    logger.info(`Grace period check: ${warned} warnings sent, ${expired} accounts downgraded`);
    return { warned, expired };
  },
);
