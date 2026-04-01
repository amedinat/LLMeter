import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from './settings-client';
import { BillingSection } from './billing-section';
import { ApiKeysSection } from './api-keys-section';
import { User, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import type { Plan } from '@/types';
import { trackEvent, EVENTS } from '@/lib/analytics';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Track settings view
  if (user) trackEvent(user.id, EVENTS.SETTINGS_VIEWED);

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, paddle_customer_id, paddle_subscription_id, current_period_end, trial_ends_at, payment_issue')
    .eq('id', user?.id ?? '')
    .single();

  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    image: user?.user_metadata?.avatar_url || null,
    provider: user?.app_metadata?.provider || 'email',
    createdAt: user?.created_at || '',
  };

  const billingData = {
    plan: (profile?.plan as Plan) || 'free',
    hasSubscription: !!profile?.paddle_subscription_id,
    currentPeriodEnd: profile?.current_period_end ?? null,
    trialEndsAt: profile?.trial_ends_at ?? null,
    paymentIssue: profile?.payment_issue ?? false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium">{userData.name}</h3>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auth Provider</p>
                <p className="text-xs text-muted-foreground capitalize">{userData.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-xs text-muted-foreground">
                  {userData.createdAt
                    ? format(new Date(userData.createdAt), 'MMMM d, yyyy')
                    : '\u2014'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <ApiKeysSection />

      {/* Billing */}
      <BillingSection
        plan={billingData.plan}
        hasSubscription={billingData.hasSubscription}
        currentPeriodEnd={billingData.currentPeriodEnd}
        trialEndsAt={billingData.trialEndsAt}
        paymentIssue={billingData.paymentIssue}
      />

      {/* Client-side settings (theme, sign out) */}
      <SettingsClient />
    </div>
  );
}
