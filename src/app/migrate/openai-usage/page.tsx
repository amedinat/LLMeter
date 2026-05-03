import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Clock,
  Code2,
  EyeOff,
  KeyRound,
  Mail,
  Network,
  RefreshCw,
  Users,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OpenAI Usage Dashboard Alternative — LLMeter (Multi-Provider, Real-Time)',
  description:
    "OpenAI's usage dashboard is OpenAI-only and lags 24h. LLMeter tracks OpenAI + Anthropic + DeepSeek + OpenRouter from a single dashboard with budget alerts and per-customer cost attribution.",
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'OpenAI Usage Dashboard Alternative — LLMeter',
    description:
      'Track OpenAI usage alongside Anthropic, DeepSeek and OpenRouter in one dashboard. Real-time, alerted, with per-customer attribution.',
    url: 'https://www.llmeter.org/migrate/openai-usage',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAI Usage Dashboard alternative — LLMeter',
    description:
      'Multi-provider LLM cost tracking. Beyond OpenAI: Anthropic, DeepSeek, OpenRouter, Mistral, Azure OpenAI. Free for 1 provider.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/openai-usage',
  },
};

const COMPARISON = [
  { feature: 'Providers covered', openai: 'OpenAI only', llmeter: 'OpenAI + Anthropic + DeepSeek + OpenRouter + Mistral + Azure OpenAI' },
  { feature: 'Update frequency', openai: '~24h delay on cost data', llmeter: 'Near real-time (every sync)' },
  { feature: 'Budget alerts', openai: 'Hard cap only (org-wide)', llmeter: 'Threshold + anomaly alerts (email + Slack webhook)' },
  { feature: 'Per-customer cost attribution', openai: 'Not supported', llmeter: 'Built-in (Team plan)' },
  { feature: 'Cost optimization hints', openai: 'None', llmeter: 'Model-switching suggestions' },
  { feature: 'Historical retention', openai: 'Limited UI history', llmeter: '30 days (Free) / 1 year (Pro) / unlimited (Team)' },
  { feature: 'CSV / PDF export for finance', openai: 'CSV only, OpenAI-only', llmeter: 'CSV + PDF, all providers' },
  { feature: 'Self-hostable', openai: 'No', llmeter: 'Yes (AGPL-3.0)' },
  { feature: 'Reads prompts/completions', openai: 'OpenAI sees them (it\'s their API)', llmeter: 'Never — only billing data' },
  { feature: 'Setup', openai: 'Built-in', llmeter: 'Read-only API key, 30 seconds' },
];

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Create a free account. No credit card. Keep using OpenAI\'s dashboard alongside if you want.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste a read-only OpenAI API key',
    description: 'Generate a read-only key in OpenAI\'s API dashboard and paste it. LLMeter pulls usage and billing data — your prompts never leave OpenAI.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Add other providers (optional)',
    description: 'When you start using Anthropic, DeepSeek or OpenRouter, paste those keys too. One dashboard for all your LLM spend.',
    icon: Network,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Why use LLMeter when OpenAI already has a usage dashboard?',
    answer:
      'OpenAI\'s dashboard is OpenAI-only and lags ~24h on cost data. The moment you add Anthropic for vision, DeepSeek for cheap completions, or OpenRouter for routing, you\'re flipping between 3-4 dashboards with different formats and billing cycles. LLMeter gives you one near-real-time view across all of them, plus alerts and per-customer attribution that OpenAI\'s native UI doesn\'t offer.',
  },
  {
    question: 'Does LLMeter replace OpenAI\'s dashboard or run alongside?',
    answer:
      'Either. Most teams keep OpenAI\'s dashboard open for org-level admin (rate limits, model access, billing payment) and use LLMeter for day-to-day cost monitoring, alerts, and finance reporting. Nothing breaks — LLMeter only reads, it doesn\'t write.',
  },
  {
    question: 'Will LLMeter see my prompts or completions?',
    answer:
      'No. LLMeter pulls usage and billing data through OpenAI\'s billing API only. Prompt content and completions stay in OpenAI. Read-only API keys are encrypted at rest with AES-256-GCM and we never log them.',
  },
  {
    question: 'How fast is LLMeter compared to OpenAI\'s usage page?',
    answer:
      'OpenAI\'s usage dashboard typically reflects spend with a 12–24h lag because billing aggregation runs once a day. LLMeter syncs on a schedule (and on-demand) so you spot spikes hours faster — which matters when a runaway agent is burning $50/hour.',
  },
  {
    question: 'Can I get budget alerts that OpenAI doesn\'t offer?',
    answer:
      'Yes. OpenAI lets you set a hard cap that stops the API once you cross it. LLMeter lets you set early warning thresholds (e.g., 50%, 80%, 100% of monthly budget) plus anomaly detection that flags abnormal daily spikes — so you find out before the hard cap hits production.',
  },
  {
    question: 'What about per-customer cost attribution?',
    answer:
      'OpenAI\'s usage dashboard reports org-wide totals — you can\'t see "customer X cost me $230 last month" without manual tagging. LLMeter\'s Team plan attributes every request to a customer ID via a single header, so you get true per-customer cost without instrumenting your code.',
  },
  {
    question: 'Is LLMeter free?',
    answer:
      'Yes for 1 provider with 1 alert and 30-day retention. Pro ($19/mo) gives you unlimited providers, alerts and 1-year retention. Team ($49/mo) adds per-customer attribution and team members. No credit card to start.',
  },
];

export default function MigrateOpenaiUsage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold text-cyan-400 sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
              <Link href="/#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">Start Free</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Badge variant="secondary" className="rounded-2xl px-4 py-1.5 text-sm">
              OpenAI Usage Dashboard &rarr; LLMeter
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Beyond OpenAI&apos;s usage page —{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                track every provider in one dashboard
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              OpenAI&apos;s native dashboard is OpenAI-only and lags 24h. LLMeter gives you near-real-time spend across OpenAI, Anthropic, DeepSeek, OpenRouter, Mistral &amp; Azure OpenAI — with budget alerts and per-customer attribution.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="#comparison">See Comparison</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 pt-2">Read-only API key. Free plan never expires.</p>
          </div>
        </section>

        {/* Why a separate dashboard */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">What OpenAI&apos;s usage page can&apos;t do</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              OpenAI&apos;s dashboard is great for OpenAI-only orgs. The moment you add a second provider — or need real alerts — you outgrow it.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Network,
                  title: 'Multi-provider blind spots',
                  description: 'Add Anthropic for vision, DeepSeek for cheap completions, OpenRouter for routing — and you\'re back to flipping between 3–4 dashboards. LLMeter unifies them in one view.',
                },
                {
                  icon: Clock,
                  title: '24h cost lag',
                  description: 'OpenAI\'s usage page reflects spend a day late. By the time you see a spike, the bill is locked in. LLMeter syncs near-real-time so you catch runaway agents the same hour.',
                },
                {
                  icon: Bell,
                  title: 'No early-warning alerts',
                  description: 'OpenAI\'s only safety net is a hard cap that breaks production at 100%. LLMeter lets you set 50/80/100% threshold alerts and anomaly detection — warned, not nuked.',
                },
                {
                  icon: Users,
                  title: 'No per-customer attribution',
                  description: 'OpenAI shows you org-wide totals. LLMeter\'s Team plan tags every request with a customer ID via a single header, so you finally know which customer is costing you $230/mo.',
                },
                {
                  icon: EyeOff,
                  title: 'No exportable reports',
                  description: 'OpenAI\'s CSV is OpenAI-only and finance can\'t reconcile against your other providers. LLMeter exports CSV + PDF across every provider in one report.',
                },
                {
                  icon: RefreshCw,
                  title: 'No optimization hints',
                  description: 'OpenAI won\'t tell you you\'d save 60% by routing GPT-4o-mini. LLMeter analyzes your actual usage and suggests model swaps with projected savings.',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-6 space-y-3">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3-Step Setup */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Set up in 3 steps</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              You don&apos;t replace OpenAI&apos;s dashboard — you add a better one beside it.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {SETUP_STEPS.map((step) => (
                <div key={step.step} className="glass-card p-6 space-y-4 relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {step.step}
                    </span>
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="comparison" className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">OpenAI Usage page vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Side-by-side on what matters once you outgrow OpenAI-only tracking.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">OpenAI Usage</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.openai}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <Check className="h-3.5 w-3.5" /> {row.llmeter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-12">FAQ</h2>
            <div className="mx-auto max-w-[42rem] divide-y">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-left font-medium">
                    {item.question}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[48rem] rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              One dashboard. Every LLM provider. Real-time.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Free for 1 provider, forever. $19/mo for unlimited. No SDK, no proxy, no code changes — just paste a read-only key.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">No credit card required. Free plan never expires.</p>
          </div>
        </section>

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
                { '@type': 'ListItem', position: 2, name: 'OpenAI Usage Alternative', item: 'https://www.llmeter.org/migrate/openai-usage' },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'OpenAI Usage Dashboard Alternative — LLMeter',
              description: "Multi-provider, real-time alternative to OpenAI's native usage dashboard.",
              url: 'https://www.llmeter.org/migrate/openai-usage',
              mainEntity: {
                '@type': 'FAQPage',
                mainEntity: FAQ_ITEMS.map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                  },
                })),
              },
            }),
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4 max-w-[64rem] mx-auto">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="https://github.com/amedinat/LLMeter" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="https://github.com/amedinat/LLMeter/issues" target="_blank" className="hover:text-foreground transition-colors">
                  GitHub Issues
                </Link>
              </li>
              <li>
                <a href="mailto:hello@llmeter.org" className="hover:text-foreground transition-colors">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Contact</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">LLMeter</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Open-source AI cost monitoring for developers. Track spend across OpenAI, Anthropic, DeepSeek &amp; OpenRouter.
            </p>
          </div>
        </div>
        <div className="container mt-8 flex flex-col items-center justify-between gap-4 max-w-[64rem] mx-auto border-t pt-6 md:flex-row">
          <p className="text-center text-xs text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} LLMeter. All rights reserved. &middot;{' '}
            <a
              href="https://simplifai.tools"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              A Simplifai product
            </a>
          </p>
          <span className="text-[10px] text-muted-foreground/30 select-none">
            {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'}
          </span>
        </div>
      </footer>
    </div>
  );
}
