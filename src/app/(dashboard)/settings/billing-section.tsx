'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ArrowUpRight, AlertTriangle } from 'lucide-react';
import type { Plan } from '@/types';
import { PLANS } from '@/config/plans';
import { format } from 'date-fns';

interface BillingSectionProps {
  plan: Plan;
  hasSubscription: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  paymentIssue: boolean;
}

export function BillingSection({ plan, hasSubscription, currentPeriodEnd, trialEndsAt, paymentIssue }: BillingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(targetPlan: string) {
    setLoading(targetPlan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading('portal');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  const isTrialing = !!trialEndsAt && new Date(trialEndsAt) > new Date();

  const proPlan = PLANS.pro;
  const teamPlan = PLANS.team;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">Current Plan</p>
          <Badge variant={plan === 'free' ? 'secondary' : 'default'}>
            {PLANS[plan].label}
          </Badge>
          {isTrialing && (
            <Badge variant="outline">Trial</Badge>
          )}
        </div>

        {paymentIssue && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Payment issue detected. Please update your payment method to avoid service interruption.
          </div>
        )}

        {currentPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            {isTrialing ? 'Trial ends' : 'Current period ends'}{' '}
            {format(new Date(currentPeriodEnd), 'MMMM d, yyyy')}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {hasSubscription ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleManage}
              disabled={loading === 'portal'}
            >
              <ArrowUpRight className="h-4 w-4" />
              {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => handleUpgrade('pro')}
                disabled={loading === 'pro'}
              >
                {loading === 'pro' ? 'Loading...' : `Upgrade to ${proPlan.label} — $${proPlan.price}/mo`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpgrade('team')}
                disabled={loading === 'team'}
              >
                {loading === 'team' ? 'Loading...' : `Upgrade to ${teamPlan.label} — $${teamPlan.price}/mo`}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
