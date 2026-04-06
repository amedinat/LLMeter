'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Key, Bell, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  done: boolean;
  cta: string;
}

interface OnboardingWelcomeProps {
  hasProviders: boolean;
  hasAlerts: boolean;
  userName?: string;
}

export function OnboardingWelcome({ hasProviders, hasAlerts, userName }: OnboardingWelcomeProps) {
  const steps: OnboardingStep[] = [
    {
      title: 'Connect your first AI provider',
      description: 'Paste your OpenAI, Anthropic, or DeepSeek API key. We\'ll pull 30 days of historical data automatically.',
      icon: <Key className="h-5 w-5" />,
      href: '/providers',
      done: hasProviders,
      cta: 'Connect Provider',
    },
    {
      title: 'Set a budget alert',
      description: 'Get notified before you overspend. Set a monthly or daily threshold and we\'ll email you when you\'re close.',
      icon: <Bell className="h-5 w-5" />,
      href: '/alerts',
      done: hasAlerts,
      cta: 'Create Alert',
    },
    {
      title: 'Explore your dashboard',
      description: 'See cost breakdowns by model, daily trends, and optimization suggestions — all in real time.',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/dashboard',
      done: hasProviders && hasAlerts,
      cta: 'View Dashboard',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {userName ? `Welcome, ${userName}!` : 'Welcome to LLMeter!'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Get full visibility into your AI spending in under 2 minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Setup progress</span>
          <span className="font-medium">{completedCount}/{steps.length} complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid gap-4">
        {steps.map((step, i) => (
          <Card
            key={i}
            className={cn(
              'transition-all',
              step.done && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20',
              !step.done && step === nextStep && 'border-cyan-300 dark:border-cyan-800 shadow-sm',
            )}
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                    : step === nextStep
                      ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {step.done ? <Check className="h-5 w-5" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-medium">{step.title}</CardTitle>
                <CardDescription className="mt-1">{step.description}</CardDescription>
              </div>
              {!step.done && step === nextStep && (
                <Button asChild size="sm">
                  <Link href={step.href}>
                    {step.cta}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {step.done && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 pt-1">Done</span>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Reassurance */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          <strong>Your API keys are encrypted</strong> with AES-256-GCM before storage.
          LLMeter uses read-only access to fetch usage data — we never make API calls on your behalf.
        </p>
      </div>
    </div>
  );
}
