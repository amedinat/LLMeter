import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  KeyRound,
  Mail,
  Package,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LangSmith Alternative — LLMeter (No SDK, No Per-Seat Pricing, Open Source)',
  description:
    'LangSmith locks you into LangChain and charges per developer seat. LLMeter is the open-source alternative — read-only API key, no SDK, flat pricing.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Migrate from LangSmith to LLMeter',
    description:
      'Open-source LLM cost monitoring without LangChain dependency or per-seat pricing.',
    url: 'https://www.llmeter.org/migrate/langsmith',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LangSmith alternative — LLMeter',
    description:
      'Open-source LLM cost monitoring. No LangChain lock-in, no per-seat pricing, no SDK.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/langsmith',
  },
};

const COMPARISON = [
  { feature: 'Framework dependency', langsmith: 'LangChain-first (best UX with LC)', llmeter: 'None — works with any HTTP client' },
  { feature: 'Pricing model', langsmith: 'Per developer seat', llmeter: 'Flat tier (Free / $19 / $49)' },
  { feature: 'Setup method', langsmith: 'SDK + LANGCHAIN_TRACING env vars', llmeter: 'Read-only API key (no code changes)' },
  { feature: 'Time to first dashboard', langsmith: '~10 min (SDK install + tracing)', llmeter: '30 seconds' },
  { feature: 'Open source', langsmith: 'No (server is closed)', llmeter: 'Yes (AGPL-3.0)' },
  { feature: 'Self-hosting', langsmith: 'Enterprise tier only', llmeter: 'Free for everyone' },
  { feature: 'Multi-provider support', langsmith: 'Whatever LangChain supports', llmeter: 'OpenAI, Anthropic, DeepSeek, OpenRouter' },
  { feature: 'Per-customer cost attribution', langsmith: 'Custom metadata (manual)', llmeter: 'Built-in' },
  { feature: 'Trace/eval features', langsmith: 'Yes (full LLMOps suite)', llmeter: 'No (cost-focused, on purpose)' },
  { feature: 'Prompt/data access', langsmith: 'Sees all prompts via SDK', llmeter: 'Never sees prompts' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Create a free account. No credit card. No team-size minimum.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste a read-only API key',
    description: 'Generate read-only keys for OpenAI/Anthropic/DeepSeek and paste them. LLMeter pulls usage data — your LangChain stack stays exactly as it is.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Disable LangSmith tracing',
    description: 'Remove LANGCHAIN_TRACING_V2 env vars and the @traceable decorators if you only used them for cost. Your LangChain code keeps running, just without sending traces to LangSmith.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is LLMeter a full LangSmith replacement?',
    answer:
      'For cost monitoring, yes. For prompt evaluation, dataset management, and agent debugging — no. LLMeter is intentionally focused on the cost layer. If you use LangSmith primarily for "how much am I spending and where," LLMeter replaces it cleanly. If you use it for prompt regression testing or eval suites, keep LangSmith for those and pair with LLMeter for cost.',
  },
  {
    question: 'Does LLMeter require LangChain?',
    answer:
      'No. LLMeter doesn\'t care which framework (or no framework) you use. It reads usage data from each provider\'s billing/usage API via read-only keys. OpenAI raw, Anthropic raw, LangChain, LlamaIndex, custom HTTP — all work the same.',
  },
  {
    question: 'Why move off LangSmith for cost monitoring?',
    answer:
      'Three common reasons we hear: (1) per-developer-seat pricing penalizes growing teams even when LLM usage stays flat, (2) you want cost visibility without committing to LangChain or maintaining @traceable wrappers, (3) you want a tool that doesn\'t see your prompts or completions for compliance reasons.',
  },
  {
    question: 'Can LLMeter see my prompts or completions?',
    answer:
      'No. LLMeter only reads usage and billing data. The provider\'s read-only API doesn\'t expose prompt content, and LLMeter never proxies your live calls. LangSmith\'s tracing model captures prompts and outputs by design — LLMeter\'s doesn\'t.',
  },
  {
    question: 'How does pricing compare for a 5-dev team?',
    answer:
      'LangSmith Plus is currently $39/dev/month — a 5-dev team pays $195/mo. LLMeter Team is $49/mo flat for the same 5 devs (and 50 more if you grow). The savings compound as the team grows; the cost-monitoring need does not scale with headcount.',
  },
  {
    question: 'Is LLMeter open source?',
    answer:
      'Yes. AGPL-3.0. You can self-host the entire thing on your infra at no cost — LangSmith\'s self-hosting is enterprise-tier only.',
  },
];

export default function MigrateLangSmith() {
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
              LangSmith &rarr; LLMeter
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              LLM cost without{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                framework lock-in
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              LangSmith is built for LangChain — and charges by developer seat. LLMeter works with any HTTP client, never sees your prompts, and ships flat pricing. Set up in 30 seconds.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Why teams move off LangSmith for cost</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              LangSmith is excellent for tracing, eval, and prompt management. As a pure cost-monitoring tool, the model has trade-offs.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: 'Per-seat pricing',
                  description: 'LangSmith Plus is per-developer. A growing team pays more for the same cost data. LLMeter is flat-tier — your bill doesn\'t track headcount.',
                },
                {
                  icon: Package,
                  title: 'LangChain coupling',
                  description: 'The best LangSmith UX assumes you\'re on LangChain. If you use raw OpenAI SDK, custom HTTP, or LlamaIndex, you\'re second-class. LLMeter is framework-agnostic by design.',
                },
                {
                  icon: Shield,
                  title: 'Tracing sees prompts',
                  description: 'LangSmith\'s tracing model captures prompts and completions by default. LLMeter only reads billing data — your prompts never leave your stack.',
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
              No SDK install. No tracing config. Your LangChain code keeps running.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">LangSmith vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              For cost monitoring specifically — the comparison most teams care about.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">LangSmith</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.langsmith}</td>
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
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Pricing comparison: LangSmith Plus $39/dev/month (Apr 2026 pricing). LLMeter Team $49/mo flat.
            </p>
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
              Cost monitoring shouldn&apos;t scale with headcount.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Free for 1 provider, forever. $19/mo for unlimited. $49/mo for the whole team. No per-seat math, no LangChain lock-in.
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from LangSmith', item: 'https://www.llmeter.org/migrate/langsmith' },
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
              name: 'Migrate from LangSmith to LLMeter',
              description: 'Open-source alternative to LangSmith for LLM cost monitoring without LangChain lock-in or per-seat pricing.',
              url: 'https://www.llmeter.org/migrate/langsmith',
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
