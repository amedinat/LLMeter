import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Code2,
  KeyRound,
  Mail,
  RefreshCw,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Migrate from Helicone to LLMeter — Fast, Open-Source Alternative',
  description:
    'Helicone was acquired by Mintlify and is entering maintenance mode. LLMeter is the open-source alternative with zero-code setup — migrate in 30 seconds.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Migrate from Helicone to LLMeter',
    description:
      'Helicone is in maintenance mode. LLMeter is the open-source alternative — set up in 30 seconds, no SDK needed.',
    url: 'https://www.llmeter.org/migrate/helicone',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Migrate from Helicone to LLMeter',
    description:
      'Helicone is in maintenance mode. LLMeter is the open-source alternative — set up in 30 seconds, no SDK needed.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/helicone',
  },
};

const COMPARISON = [
  { feature: 'Setup method', helicone: 'Proxy (change base URL)', llmeter: 'Read-only API key (no code changes)' },
  { feature: 'Time to first dashboard', helicone: '~5 min (SDK/proxy config)', llmeter: '30 seconds' },
  { feature: 'Code changes required', helicone: 'Yes (base URL, headers)', llmeter: 'None' },
  { feature: 'Open source', helicone: 'Yes', llmeter: 'Yes' },
  { feature: 'Active development', helicone: 'Maintenance mode only', llmeter: 'Active' },
  { feature: 'Multi-provider support', helicone: 'OpenAI, Anthropic, more', llmeter: 'OpenAI, Anthropic, DeepSeek, OpenRouter' },
  { feature: 'Budget alerts', helicone: 'Basic', llmeter: 'Advanced (anomaly detection, daily thresholds)' },
  { feature: 'Free tier', helicone: '10K requests/mo', llmeter: 'Free forever (1 provider)' },
  { feature: 'Prompt/data access', helicone: 'Proxies all traffic', llmeter: 'Never sees prompts or completions' },
  { feature: 'Team features', helicone: 'Yes', llmeter: 'Yes (Team plan, $49/mo)' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Create a free account. No credit card required.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste your read-only API key',
    description: 'Go to your provider\'s dashboard, generate a read-only key, and paste it into LLMeter. That\'s it.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Remove the Helicone proxy',
    description: 'Revert your base URL and headers back to the provider defaults. No more proxy dependency.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Why is Helicone shutting down active development?',
    answer:
      'Helicone was acquired by Mintlify in March 2026. The Mintlify team announced that active feature development has ended — only security patches, bug fixes, and new model support will continue. The 16,000+ organizations using Helicone in production are encouraged to plan their migration.',
  },
  {
    question: 'Does LLMeter require me to change my API base URL?',
    answer:
      'No. Unlike Helicone\'s proxy approach, LLMeter uses read-only API keys to fetch your usage data directly from the provider. Your application code stays untouched — no base URL changes, no headers, no SDK.',
  },
  {
    question: 'Can LLMeter see my prompts or completions?',
    answer:
      'No. LLMeter only accesses usage and billing data through read-only API keys. We never see your prompts, completions, or any content flowing through your LLM calls. This is a fundamental architectural difference from proxy-based tools.',
  },
  {
    question: 'How long does migration take?',
    answer:
      'Setting up LLMeter takes about 30 seconds — just paste a read-only API key. Removing the Helicone proxy from your codebase depends on how many services use it, but for most teams it\'s a one-line revert per service.',
  },
  {
    question: 'What if I need features Helicone had that LLMeter doesn\'t?',
    answer:
      'LLMeter focuses on cost monitoring, budget alerts, and optimization — the core features most teams use Helicone for. If you relied on Helicone\'s prompt logging or evaluation features, those are outside LLMeter\'s scope. For pure cost visibility, LLMeter is a drop-in replacement.',
  },
  {
    question: 'Is LLMeter free?',
    answer:
      'Yes — the Free plan supports 1 provider with 30-day retention, forever. The Pro plan ($19/mo) adds unlimited providers, alerts, anomaly detection, and 1-year retention. Team plans start at $49/mo.',
  },
];

export default function MigrateHelicone() {
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
              Helicone &rarr; LLMeter Migration Guide
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Helicone is in{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                maintenance mode
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Helicone was acquired by Mintlify in March 2026. Active development has stopped.
              LLMeter is the open-source alternative — set up in 30 seconds with a read-only API key. No proxy, no SDK, no code changes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/login">
                  Migrate Now — Free
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

        {/* Why Migrate */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Why migrate now?</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              16,000+ organizations relied on Helicone in production. Here&apos;s what the acquisition means for you.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: 'No new features',
                  description: 'Mintlify confirmed only security patches and bug fixes going forward. No new integrations, no new analytics, no roadmap.',
                },
                {
                  icon: Shield,
                  title: 'Proxy risk',
                  description: 'Helicone proxies all your LLM traffic. A maintenance-mode proxy is a single point of failure you can\'t afford.',
                },
                {
                  icon: Zap,
                  title: 'Zero-downtime switch',
                  description: 'LLMeter uses read-only API keys — no proxy dependency. Switch monitoring tools without touching your application code.',
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

        {/* 3-Step Migration */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Migrate in 3 steps</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              No SDK installation. No code deployment. Just paste a key and go.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Helicone vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              A side-by-side comparison of what matters for LLM cost monitoring.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Helicone</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.helicone === 'Maintenance mode only' ? (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <X className="h-3.5 w-3.5" /> {row.helicone}
                          </span>
                        ) : (
                          row.helicone
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.llmeter === 'Active' || row.llmeter === 'None' || row.llmeter === '30 seconds' ? (
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

        {/* Key Differentiator */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">No proxy. No risk.</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Helicone routes all your LLM traffic through its proxy servers. LLMeter takes a fundamentally different approach.
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="glass-card p-6 space-y-4 border-destructive/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <X className="h-5 w-5 text-destructive" /> Helicone (proxy-based)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> All LLM traffic routed through Helicone servers</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Proxy outage = your LLM calls fail</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Requires code changes (base URL, headers)</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> Third party sees all prompts and completions</li>
                </ul>
              </div>
              <div className="glass-card p-6 space-y-4 border-primary/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" /> LLMeter (API key-based)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Reads usage data directly from provider APIs</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Zero impact on your LLM call latency or reliability</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> No code changes — paste a key and go</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Never sees your prompts or completions</li>
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
              Don&apos;t wait for the proxy to go dark.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Join the teams migrating from Helicone to LLMeter. Set up in 30 seconds — no proxy, no SDK, no code changes. Free forever for 1 provider.
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from Helicone', item: 'https://www.llmeter.org/migrate/helicone' },
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
              name: 'Migrate from Helicone to LLMeter',
              description: 'Migration guide for teams moving from Helicone to LLMeter for LLM cost monitoring.',
              url: 'https://www.llmeter.org/migrate/helicone',
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
