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
  X,
  Zap,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datadog LLM Observability Alternative — LLMeter (Open Source, $0–$19/mo)',
  description:
    'Datadog LLM Observability runs $31+/host/mo with enterprise contracts. LLMeter is the open-source, indie-friendly alternative — set up in 30 seconds, free for 1 provider.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Migrate from Datadog LLM Observability to LLMeter',
    description:
      'Open-source LLM cost monitoring that doesn\'t require an enterprise contract. 30-second setup. Free for 1 provider.',
    url: 'https://www.llmeter.org/migrate/datadog-llm',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Datadog LLM alternative — LLMeter (open-source, $0–$19/mo)',
    description:
      'Open-source LLM cost monitoring without the enterprise contract. Free for 1 provider, $19/mo unlimited.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/datadog-llm',
  },
};

const COMPARISON = [
  { feature: 'Pricing model', datadog: 'Per-host + per-event + custom contract', llmeter: 'Free / $19 / $49 — flat tier' },
  { feature: 'Entry price', datadog: '$31+/host/mo (LLM Observability)', llmeter: 'Free for 1 provider' },
  { feature: 'Setup method', datadog: 'Agent install + APM trace SDK', llmeter: 'Read-only API key (no code)' },
  { feature: 'Time to first dashboard', datadog: 'Hours (agent + sampling tuning)', llmeter: '30 seconds' },
  { feature: 'Open source', datadog: 'No', llmeter: 'Yes (AGPL-3.0)' },
  { feature: 'Self-hosting', datadog: 'No', llmeter: 'Yes' },
  { feature: 'Vendor lock-in', datadog: 'High (proprietary tags + queries)', llmeter: 'None — read-only key, leave anytime' },
  { feature: 'Multi-provider support', datadog: 'OpenAI, Anthropic + custom', llmeter: 'OpenAI, Anthropic, DeepSeek, OpenRouter' },
  { feature: 'Per-customer cost attribution', datadog: 'Custom dimensions (extra cost)', llmeter: 'Built-in, free tier' },
  { feature: 'Indie / solo-dev fit', datadog: 'Built for enterprise', llmeter: 'Built for indie & SMB' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Create a free account. No credit card. No sales call.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste a read-only API key',
    description: 'Generate a read-only key in OpenAI/Anthropic/DeepSeek and paste it. LLMeter pulls usage, you keep your stack untouched.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Disable LLM Observability in Datadog',
    description: 'Stop the LLM trace SDK and remove the Datadog agent\'s LLM module. Your APM/infra metrics keep working — only the LLM cost piece moves.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Why move off Datadog LLM Observability?',
    answer:
      'Three reasons we keep hearing: (1) the per-host + per-event pricing punishes high-throughput agents, (2) the LLM module is bolted onto an APM-first product so the cost views feel secondary, and (3) it requires SDK instrumentation in your application code — which means another deploy every time you change scope.',
  },
  {
    question: 'Will I lose my Datadog APM/infra dashboards?',
    answer:
      'No. LLMeter only replaces the LLM cost monitoring piece. Your application performance, infrastructure, log, and synthetic monitors in Datadog are untouched. You only disable the LLM Observability module.',
  },
  {
    question: 'Does LLMeter need an SDK or code changes?',
    answer:
      'No. LLMeter uses provider-issued read-only API keys to fetch your usage and billing data directly. There\'s no agent, no tracer, no SDK in your runtime. Setup is closer to "paste a key" than "deploy a sidecar."',
  },
  {
    question: 'Can LLMeter see my prompts or completions?',
    answer:
      'No. LLMeter only reads usage and billing data exposed by each provider\'s read-only API. Prompt content, completions, and intermediate tool calls never leave your stack.',
  },
  {
    question: 'How does pricing compare on a real workload?',
    answer:
      'A team running 5M LLM calls/month across 3 services on Datadog LLM Observability typically lands in the $300–$900/mo range when you add per-event ingestion and per-host fees. The same workload runs on LLMeter Pro for $19/mo flat.',
  },
  {
    question: 'Is LLMeter open source?',
    answer:
      'Yes. LLMeter is AGPL-3.0. You can audit the code, self-host, and verify exactly what runs against your provider keys. Datadog\'s LLM Observability is proprietary and SaaS-only.',
  },
];

export default function MigrateDatadogLlm() {
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
              Datadog LLM Observability &rarr; LLMeter
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              LLM cost monitoring{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                without the enterprise contract
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Datadog LLM Observability is built for enterprise APM customers. LLMeter is built for indie devs and SMB teams that just want to know what their LLM bill is — open-source, $0&ndash;$19/mo, 30-second setup.
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

        {/* Why migrate */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Why teams move off Datadog LLM</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Datadog is great APM. As an LLM cost tool for indie or SMB teams, the economics break.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: 'Per-host pricing punishes scale',
                  description: '$31+/host/month for LLM Observability adds up fast when you horizontally scale your inference workers. LLMeter is flat-tier — your bill doesn\'t track your traffic.',
                },
                {
                  icon: Server,
                  title: 'Agent + SDK overhead',
                  description: 'Datadog needs an agent install plus LLM trace SDK in your code. LLMeter uses a read-only API key. Zero runtime overhead, zero re-deploys to change scope.',
                },
                {
                  icon: Zap,
                  title: 'Bolted onto APM',
                  description: 'LLM Observability is a module inside Datadog\'s APM-first product. LLMeter is built ground-up for LLM cost — every screen is about token spend, not request latency.',
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
              No agent install. No SDK in your code. Just paste a key.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Datadog LLM vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Side-by-side on what matters for indie and SMB teams.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Datadog LLM</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.datadog}</td>
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
              Stop paying enterprise prices for indie LLM bills.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Free for 1 provider, forever. $19/mo for unlimited. No agent, no SDK, no sales call. Just paste a key and start.
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from Datadog LLM', item: 'https://www.llmeter.org/migrate/datadog-llm' },
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
              name: 'Migrate from Datadog LLM Observability to LLMeter',
              description: 'Open-source alternative to Datadog LLM Observability for indie and SMB teams.',
              url: 'https://www.llmeter.org/migrate/datadog-llm',
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
