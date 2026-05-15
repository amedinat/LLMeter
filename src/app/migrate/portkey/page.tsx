import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  DollarSign,
  KeyRound,
  Mail,
  RefreshCw,
  Server,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portkey Alternative for LLM Cost Monitoring — LLMeter (No Gateway Required)',
  description:
    'Portkey is an AI gateway: every LLM call routes through their servers. LLMeter is the no-gateway alternative — read-only API keys, zero proxy, just cost tracking. Free for 1 provider.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Portkey alternative — LLMeter (no gateway, cost-only)',
    description:
      'If you only need LLM cost tracking — not routing or fallback — LLMeter skips the gateway entirely. Read-only API keys, 30-second setup, open-source.',
    url: 'https://www.llmeter.org/migrate/portkey',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portkey alternative — LLMeter (no gateway, cost-only)',
    description:
      'LLMeter tracks LLM cost without sitting in front of every request. Read-only API keys. Free for 1 provider.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/portkey',
  },
};

const COMPARISON = [
  { feature: 'Architecture', portkey: 'AI gateway (proxy on every call)', llmeter: 'Read-only API key (no proxy)' },
  { feature: 'Setup method', portkey: 'SDK install + base URL swap', llmeter: 'Paste a read-only key' },
  { feature: 'Time to first dashboard', portkey: '~10 min (SDK config + virtual keys)', llmeter: '30 seconds' },
  { feature: 'Code changes required', portkey: 'Yes (SDK + base URL)', llmeter: 'None' },
  { feature: 'Adds latency to LLM calls', portkey: 'Yes (one extra hop)', llmeter: 'No (out-of-band)' },
  { feature: 'Sees prompts/completions', portkey: 'Yes (proxies all traffic)', llmeter: 'No (only billing data)' },
  { feature: 'Routing / fallback / caching', portkey: 'Yes (primary feature)', llmeter: 'No (out of scope)' },
  { feature: 'Open source', portkey: 'SDK yes, gateway hosted', llmeter: 'AGPL-3.0 (full stack)' },
  { feature: 'Pricing entry', portkey: '$0 (limited) → $99/mo Pro', llmeter: 'Free for 1 provider → $19/mo Pro' },
  { feature: 'Best fit', portkey: 'Teams that need routing + fallback', llmeter: 'Teams that only need cost visibility' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Free account, no credit card. The free plan covers 1 provider forever.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste a read-only provider key',
    description: 'Generate a read-only key in OpenAI / Anthropic / DeepSeek / OpenRouter and paste it into LLMeter. No SDK to install, no virtual keys to mint.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Revert the Portkey base URL (if you only used cost tracking)',
    description: 'If routing/fallback was the reason you adopted Portkey, keep it — LLMeter is complementary. If cost tracking was the only feature, you can revert the proxy and reclaim the latency.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'When does it make sense to drop Portkey for LLMeter?',
    answer:
      'If the main reason you adopted Portkey was the dashboard for cost and usage, and you do not actively rely on routing, fallback, retries, prompt caching, or guardrails — LLMeter does the cost half without the gateway. Teams that need multi-provider routing or fallback should keep Portkey: those features have no equivalent in LLMeter.',
  },
  {
    question: 'Does LLMeter sit in front of my LLM calls like Portkey does?',
    answer:
      'No. LLMeter never proxies traffic. It uses read-only API keys to pull usage data from the provider directly (OpenAI usage API, Anthropic billing endpoints, etc.) on a polling schedule. Your application talks to OpenAI / Anthropic / DeepSeek the same way it always did — no extra hop, no extra latency, no extra failure mode.',
  },
  {
    question: 'Can LLMeter see my prompts or completions?',
    answer:
      'No. Read-only API keys grant access to usage and billing data only. LLMeter never sees the content of a single request. This is a hard architectural property — there is no opt-out because there is no path for prompts to reach LLMeter servers in the first place.',
  },
  {
    question: 'How does the cost data compare to what Portkey shows?',
    answer:
      'LLMeter pulls cost data straight from the provider, so it matches your invoice to the cent. Portkey computes cost from the request stream it proxies — the numbers usually match but can drift if the gateway misses requests during an incident. LLMeter\'s source of truth is the provider, not a proxy log.',
  },
  {
    question: 'I run on Portkey today. How risky is the switch?',
    answer:
      'Low risk because LLMeter is additive. You can run LLMeter alongside Portkey for a week, compare the dashboards, and only then decide whether to drop the gateway. Read-only keys do not interfere with any traffic Portkey is handling.',
  },
  {
    question: 'Is LLMeter free?',
    answer:
      'Yes — the Free plan covers 1 provider with 30-day retention, forever. The Pro plan ($19/mo) adds unlimited providers, budget alerts, anomaly detection, and 1-year retention. Team plans start at $49/mo with seats and shared budgets.',
  },
];

export default function MigratePortkey() {
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
              Portkey &rarr; LLMeter Migration Guide
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              You don&apos;t need a{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                gateway
              </span>
              {' '}to track LLM cost
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Portkey is an AI gateway — every LLM call routes through their servers so they can also handle routing, fallback, and caching.
              If all you need is cost visibility, LLMeter pulls the same numbers from a read-only API key. No proxy. No SDK. No latency hop.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">
                  Try LLMeter Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="#comparison">See Comparison</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 pt-2">No credit card required. Free plan never expires.</p>
          </div>
        </section>

        {/* When to switch */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">When does the switch make sense?</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Portkey and LLMeter solve different halves of the same problem. Pick by what you actually use today.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: 'You log in for cost numbers',
                  description: 'If 90% of your Portkey dashboard time is spent looking at spend per model, customer, or environment — that\'s the half LLMeter handles natively, without a gateway.',
                },
                {
                  icon: Zap,
                  title: 'You want less latency',
                  description: 'A gateway adds one network hop to every LLM call. For latency-sensitive products (chat, agentic loops), removing the hop is a free p95 improvement.',
                },
                {
                  icon: Shield,
                  title: 'You\'d rather not proxy prompts',
                  description: 'LLMeter never sees a single prompt or completion. Read-only billing keys cannot read content — there\'s no path for it to reach LLMeter servers.',
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-6 space-y-3">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground/80 max-w-[42rem] mx-auto mt-10">
              Keep Portkey if you actively use routing, automatic fallback between providers, prompt caching, or guardrails — those have no LLMeter equivalent.
            </p>
          </div>
        </section>

        {/* 3-Step Migration */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Set up in 3 steps</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              No SDK installation. No code deployment. Just a read-only key.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {MIGRATION_STEPS.map((step) => (
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Portkey vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Same goal (LLM cost visibility), two different architectures.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Portkey</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.portkey}</td>
                      <td className="px-4 py-3">
                        {row.llmeter === 'No (out-of-band)' || row.llmeter === 'No (only billing data)' || row.llmeter === 'None' || row.llmeter === '30 seconds' ? (
                          <span className="inline-flex items-center gap-1 text-primary font-medium">
                            <Check className="h-3.5 w-3.5" /> {row.llmeter}
                          </span>
                        ) : (
                          row.llmeter
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Architecture difference */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Gateway vs read-only key</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              The architectural choice changes what you can ship — and what can break.
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="glass-card p-6 space-y-4 border-muted-foreground/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5 text-muted-foreground" /> Portkey (gateway)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Routing, fallback, retries, caching, guardrails</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Adds latency on every LLM call</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Gateway outage propagates to your product</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Third party sees prompts and completions</li>
                </ul>
              </div>
              <div className="glass-card p-6 space-y-4 border-primary/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" /> LLMeter (read-only key)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Pulls usage/billing data directly from providers</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Zero latency impact (out-of-band)</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> LLMeter downtime cannot break your LLM calls</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Never sees prompts or completions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-12">Migration FAQ</h2>
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
              Cost visibility without the proxy hop.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Plug LLMeter in next to Portkey for a week, compare the numbers, and decide. Free forever for 1 provider.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">
                  Start Monitoring for Free
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from Portkey', item: 'https://www.llmeter.org/migrate/portkey' },
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
              name: 'Portkey Alternative for LLM Cost Monitoring — LLMeter',
              description: 'Side-by-side guide for teams comparing Portkey (AI gateway) to LLMeter (read-only API key, cost-only).',
              url: 'https://www.llmeter.org/migrate/portkey',
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
