import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  ChevronDown,
  DollarSign,
  KeyRound,
  Mail,
  RefreshCw,
  Target,
  Zap,
  X,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Braintrust Alternative for LLM Cost Tracking — LLMeter (Cost-Only, $0–$19/mo)',
  description:
    'Braintrust is built for LLM evals. If you only need to watch the cost meter (not the quality meter), LLMeter is the cost-only alternative — read-only API keys, 30-second setup, free for 1 provider.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Braintrust alternative — LLMeter (cost-only, $0–$19/mo)',
    description:
      'Braintrust focuses on evals; LLMeter focuses on cost. If you do not need eval infrastructure, LLMeter is the lighter, cheaper alternative for cost monitoring.',
    url: 'https://www.llmeter.org/migrate/braintrust',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Braintrust alternative — LLMeter (cost-only)',
    description:
      'LLMeter is a focused cost tracker, not an eval platform. Read-only API key, 30-second setup, free for 1 provider.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/braintrust',
  },
};

const COMPARISON = [
  { feature: 'Primary use case', braintrust: 'LLM evaluation + prompt iteration', llmeter: 'LLM cost monitoring + budget alerts' },
  { feature: 'Setup method', braintrust: 'SDK install + logger.wrap calls', llmeter: 'Read-only API key (no code)' },
  { feature: 'Time to first dashboard', braintrust: 'Hours (instrument app + run evals)', llmeter: '30 seconds' },
  { feature: 'Code changes required', braintrust: 'Yes (SDK + log wrapping)', llmeter: 'None' },
  { feature: 'Cost tracking', braintrust: 'Available as side feature', llmeter: 'Core product (only feature)' },
  { feature: 'Eval / scoring framework', braintrust: 'Yes (primary feature)', llmeter: 'No (out of scope)' },
  { feature: 'Sees prompts/completions', braintrust: 'Yes (logged for eval)', llmeter: 'No (only billing data)' },
  { feature: 'Open source', braintrust: 'SDK yes, platform hosted', llmeter: 'AGPL-3.0 (full stack)' },
  { feature: 'Pricing entry', braintrust: 'Free limited → paid tiers', llmeter: 'Free for 1 provider → $19/mo Pro' },
  { feature: 'Best fit', braintrust: 'Teams doing prompt evaluation', llmeter: 'Teams that only need cost numbers' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Decide if you actually use evals',
    description: 'If 90% of your Braintrust usage is the cost panel, LLMeter does that half without instrumentation. If you actively run experiments / regression eval suites, keep Braintrust.',
    icon: Target,
  },
  {
    step: 2,
    title: 'Sign up for LLMeter + paste a key',
    description: 'Create a free account, generate a read-only key in your provider dashboard, paste it. No SDK, no log wrapping, no dataset upload.',
    icon: KeyRound,
  },
  {
    step: 3,
    title: 'Remove Braintrust SDK from cost-only services',
    description: 'For services where Braintrust was instrumented purely for the cost dashboard, you can remove the SDK and reclaim the bundle size and latency. Keep it in services that run real evals.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is LLMeter trying to replace Braintrust?',
    answer:
      'Not directly. Braintrust is an eval platform — it shines at prompt iteration, regression testing, and scoring models against datasets. LLMeter is a focused cost tracker. The overlap is the cost dashboard: if that is the only Braintrust feature you log in for, LLMeter does it without the SDK.',
  },
  {
    question: 'Do I have to choose between them?',
    answer:
      'No — they are complementary. Many teams run Braintrust for eval and LLMeter for cost in parallel: Braintrust gives quality numbers, LLMeter gives spend numbers, both stay narrow at what they do. The question is whether you are paying for Braintrust\'s cost features that you are not using.',
  },
  {
    question: 'Does LLMeter capture prompts and completions like Braintrust does?',
    answer:
      'No. Braintrust logs prompts and completions so it can run evals against them. LLMeter uses read-only API keys to pull billing data — it never sees a single prompt. If you need to inspect the content of LLM calls, LLMeter is not the right tool.',
  },
  {
    question: 'How accurate is the cost data compared to Braintrust?',
    answer:
      'LLMeter pulls cost data directly from the provider, so it matches your invoice exactly. Braintrust computes cost from the requests its SDK observes — usually identical, but it can drift if your code makes calls outside the wrapped paths. LLMeter\'s source of truth is the provider, not the instrumented layer.',
  },
  {
    question: 'What about per-customer cost attribution?',
    answer:
      'Both can do it. In Braintrust you tag spans with metadata at log time. In LLMeter you pass metadata (user_id, tenant_id) when making the OpenAI / Anthropic call and the provider attaches it to the usage record LLMeter reads — same outcome, no SDK in the middle.',
  },
  {
    question: 'Is LLMeter free?',
    answer:
      'Yes — the Free plan covers 1 provider with 30-day retention, forever. The Pro plan ($19/mo) adds unlimited providers, alerts, anomaly detection, and 1-year retention. Team plans start at $49/mo.',
  },
];

export default function MigrateBraintrust() {
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
              Braintrust &rarr; LLMeter Migration Guide
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              You don&apos;t need an eval platform to{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                watch LLM cost
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Braintrust is excellent at LLM evaluation — prompt iteration, regression testing, scoring against datasets.
              If the only panel you actually use is the cost dashboard, LLMeter does that half with a read-only API key and zero SDK. Free for 1 provider.
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
              Braintrust is an eval platform. LLMeter is a cost tracker. Pick by what you actually do.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: 'You log in for cost numbers',
                  description: 'If your Braintrust dashboard time is mostly spent on spend per model / customer / environment — that is the part LLMeter handles natively, without the SDK.',
                },
                {
                  icon: Target,
                  title: 'You\'re not running evals',
                  description: 'Eval infrastructure has a real maintenance cost (datasets, scorers, regression suites). If your team is not using it, you are paying for unused weight.',
                },
                {
                  icon: Zap,
                  title: 'You want zero-instrumentation setup',
                  description: 'LLMeter pulls billing data from the provider directly. No SDK to wire in. No log wrappers. No deployments to push first.',
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
              Keep Braintrust if you run prompt experiments, regression eval suites, or score models against curated datasets — those features have no LLMeter equivalent.
            </p>
          </div>
        </section>

        {/* 3-Step Migration */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">3 steps to switch</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              You can run them side-by-side first. The migration is additive.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Braintrust vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Different products, overlapping cost panel. Here is what changes.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Braintrust</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.braintrust}</td>
                      <td className="px-4 py-3">
                        {row.llmeter === 'No (only billing data)' || row.llmeter === 'None' || row.llmeter === '30 seconds' || row.llmeter === 'Core product (only feature)' ? (
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

        {/* Scope comparison */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Eval platform vs cost tracker</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Pay for the tool that matches the work you do.
            </p>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="glass-card p-6 space-y-4 border-muted-foreground/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" /> Braintrust (eval platform)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Prompt experiments + regression eval</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Scoring framework + dataset management</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Cost tracking (side feature)</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Requires SDK + log wrapping</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> Captures prompts and completions</li>
                </ul>
              </div>
              <div className="glass-card p-6 space-y-4 border-primary/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" /> LLMeter (cost tracker)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Cost per model / customer / environment</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Budget alerts + anomaly detection</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Read-only API key (no SDK)</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Never sees prompts or completions</li>
                  <li className="flex items-start gap-2"><X className="h-4 w-4 text-primary shrink-0 mt-0.5" /> No eval framework (use Braintrust if needed)</li>
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
              Cost-only, no eval-platform weight.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Run LLMeter alongside Braintrust for a week and see if the cost panel is all you need. Free forever for 1 provider.
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from Braintrust', item: 'https://www.llmeter.org/migrate/braintrust' },
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
              name: 'Braintrust Alternative for LLM Cost Tracking — LLMeter',
              description: 'Comparison for teams considering Braintrust (eval platform with cost feature) vs LLMeter (focused cost tracker).',
              url: 'https://www.llmeter.org/migrate/braintrust',
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
