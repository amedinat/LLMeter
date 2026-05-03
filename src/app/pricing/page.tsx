import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PLANS } from '@/config/plans';
import { PricingCheckout } from './pricing-checkout';

const VISIBLE_PLANS = [PLANS.free, PLANS.pro, PLANS.team];
const VALID_PLANS = ['pro', 'team'] as const;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — LLMeter',
  description:
    'Simple, transparent pricing for AI cost monitoring. Free tier with 1 provider, Pro at $19/mo with 7-day free trial, Team at $49/mo.',
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: 'https://www.llmeter.org/pricing' },
  openGraph: {
    title: 'Pricing — LLMeter',
    description:
      'Simple, transparent pricing for AI cost monitoring. Free tier with 1 provider, Pro at $19/mo, Team at $49/mo.',
    url: 'https://www.llmeter.org/pricing',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — LLMeter',
    description:
      'Simple, transparent pricing for AI cost monitoring. Free tier included.',
    images: ['/og-image.png'],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
    { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://www.llmeter.org/pricing' },
  ],
};

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'LLMeter Pricing',
  url: 'https://www.llmeter.org/pricing',
  description: 'Simple, transparent pricing for AI cost monitoring. Free tier with 1 provider, Pro at $19/mo with 7-day free trial, Team at $49/mo.',
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'LLMeter',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    url: 'https://www.llmeter.org',
    image: 'https://www.llmeter.org/og-image.png',
    description: 'Open-source LLM cost monitoring. Track usage and spend across OpenAI, Anthropic, Google AI, DeepSeek, OpenRouter, and Mistral from a single dashboard — no proxy, no latency impact.',
    brand: {
      '@type': 'Brand',
      name: 'Simplifai',
    },
    offers: VISIBLE_PLANS.filter((p) => p.price !== null).map((plan) => ({
      '@type': 'Offer',
      name: plan.label,
      price: String(plan.price),
      priceCurrency: 'USD',
      description: plan.description,
      url: 'https://www.llmeter.org/pricing',
      availability: 'https://schema.org/InStock',
      category: 'SaaS subscription',
      ...(plan.trialDays > 0 ? { eligibleDuration: `P${plan.trialDays}D` } : {}),
    })),
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is $19/month worth it for LLMeter Pro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, if you spend more than $50/month on AI APIs. One prevented cost spike — a runaway batch job, a forgotten eval loop, or a misconfigured model — typically costs $30–$200. Pro pays for itself the first time it fires an anomaly alert.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I try LLMeter Pro before paying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Yes! Pro comes with a ${PLANS.pro.trialDays}-day free trial. No credit card required to start.`,
      },
    },
    {
      '@type': 'Question',
      name: 'What happens when my LLMeter trial ends?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you haven\'t added a payment method, your account will be downgraded to the Free plan. Your data is preserved but access to premium features is paused.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I change LLMeter plans later?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Upgrade or downgrade at any time from your settings page. Changes are prorated so you only pay for what you use.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data secure on LLMeter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. API keys are encrypted at rest using AES-256-GCM. We never store or log your raw API keys.',
      },
    },
  ],
};

const FREE_LIMITS = [
  'Only 1 provider (OpenRouter not included)',
  'Data deleted after 30 days',
  'Only 1 budget alert',
  'No anomaly detection',
  'No Slack notifications',
];

const PRO_UNLOCKS = [
  'All providers — OpenAI, Anthropic, DeepSeek, OpenRouter',
  '1 year of cost history for trend analysis',
  'Unlimited budget alerts across all providers',
  'Anomaly detection — get alerted before a spike hits your card',
  'Slack notifications so your team sees alerts instantly',
  'CSV & PDF exports to justify AI costs to finance',
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const autoTriggerPlan = VALID_PLANS.includes(plan as typeof VALID_PLANS[number]) ? plan : undefined;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">How It Works</Link>
              <Link href="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="/models" className="transition-colors hover:text-foreground/80 text-foreground/60">Model Pricing</Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground">Pricing</Link>
              <Link href="/#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none" />
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Start Free</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Stop overpaying for AI you can&apos;t see
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              The average developer discovers an unexpected AI billing spike <strong>after</strong> the invoice arrives.
              LLMeter catches it before the charge hits — starting free.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">Pro includes a {PLANS.pro.trialDays}-day free trial</p>
            </div>
          </div>
        </section>

        {/* Plans grid */}
        <section className="container pb-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-[64rem] mx-auto">
            {VISIBLE_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col${plan.highlighted ? ' relative border-primary shadow-lg' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.label}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    {plan.price === null ? (
                      <span>Custom</span>
                    ) : plan.price === 0 ? (
                      <span>
                        $0
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      </span>
                    ) : (
                      <span>
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      </span>
                    )}
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-sm text-primary mt-1 font-medium">
                      {plan.trialDays}-day free trial — no credit card required
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {plan.featureList.map((feat) => (
                      <li key={feat} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 shrink-0 text-primary" />{' '}
                        {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {plan.paddlePriceId ? (
                    <PricingCheckout
                      planId={plan.id}
                      cta={plan.cta}
                      ctaVariant={plan.ctaVariant}
                      autoTrigger={autoTriggerPlan === plan.id}
                    />
                  ) : (
                    <Button variant={plan.ctaVariant} className="w-full" asChild>
                      <Link href={plan.price === null ? 'mailto:hello@llmeter.org' : '/login'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Pay — ROI section */}
        <section className="container pb-16">
          <div className="mx-auto max-w-[64rem] space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold">Is $19/month worth it?</h2>
              <p className="text-muted-foreground max-w-[42rem] mx-auto">
                Pro pays for itself the first time it catches a cost spike you would have missed.
              </p>
            </div>

            {/* Breakeven scenarios */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 space-y-3">
                <div className="text-3xl font-bold text-primary">1×</div>
                <h3 className="font-semibold">One prevented overage</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A runaway batch job or forgotten eval loop typically costs $30–$200.
                  One anomaly alert pays for Pro for 1–10 months.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-3">
                <div className="text-3xl font-bold text-primary">2+</div>
                <h3 className="font-semibold">Multiple LLM providers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you&apos;re juggling OpenAI, Anthropic, and DeepSeek billing pages,
                  Pro unifies everything in one place — saving 30+ minutes of manual work per week.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 space-y-3">
                <div className="text-3xl font-bold text-primary">$50+</div>
                <h3 className="font-semibold">Monthly AI API spend</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once you&apos;re spending $50+/month on AI, visibility into your costs is
                  worth more than $19. One bad month without monitoring can cost 10× that.
                </p>
              </div>
            </div>

            {/* Free vs Pro comparison */}
            <div className="rounded-xl border overflow-hidden">
              <div className="grid grid-cols-2 divide-x">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                    <h3 className="font-semibold text-muted-foreground">Staying on Free means…</h3>
                  </div>
                  <ul className="space-y-3">
                    {FREE_LIMITS.map((limit) => (
                      <li key={limit} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" />
                        {limit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 space-y-4 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <h3 className="font-semibold">Pro unlocks…</h3>
                  </div>
                  <ul className="space-y-3">
                    {PRO_UNLOCKS.map((unlock) => (
                      <li key={unlock} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {unlock}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Start with the {PLANS.pro.trialDays}-day free trial. No credit card required.
                Cancel before it ends and you&apos;ll never be charged.
              </p>
              <Button size="lg" asChild>
                <Link href="/login">
                  Try Pro Free for {PLANS.pro.trialDays} Days
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container pb-16">
          <div className="mx-auto max-w-[42rem] space-y-8">
            <h2 className="text-2xl font-bold text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Is $19/month worth it?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes, if you spend more than $50/month on AI APIs. One prevented spike — a
                  runaway batch job, a forgotten eval loop — typically costs $30–$200. Pro
                  pays for itself the first time it fires an anomaly alert.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Can I try Pro before paying?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes! Pro comes with a {PLANS.pro.trialDays}-day free trial. No credit card
                  required to start. Cancel before the trial ends and you&apos;ll never be charged.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">What happens when my trial ends?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If you haven&apos;t added a payment method, your account will be downgraded
                  to the Free plan. Your data is preserved but access to premium features is paused.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Can I change plans later?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Absolutely. Upgrade or downgrade at any time from your settings page.
                  Changes are prorated so you only pay for what you use.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes. API keys are encrypted at rest using AES-256-GCM. We never store or
                  log your raw API keys. You can use read-only provider keys for maximum safety.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">What if I only use one provider?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Free tier covers one provider forever. Upgrade to Pro when you add a second
                  provider, want anomaly detection, or need more than 30 days of history.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:px-8 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{' '}
            <a
              href="https://github.com/amedinat/LLMeter"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              LLMeter Team
            </a>
            . Source on{' '}
            <a
              href="https://github.com/amedinat/LLMeter"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            . &middot;{' '}
            <a
              href="https://simplifai.tools"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              A Simplifai product
            </a>
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privacy</Link>
            <Link href="/refund" className="hover:text-foreground underline-offset-4 hover:underline">Refund</Link>
            <a href="mailto:hello@llmeter.org" className="hover:text-foreground underline-offset-4 hover:underline">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
