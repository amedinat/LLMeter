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
  Package,
  RefreshCw,
  Server,
  Shield,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Langfuse Alternative — LLMeter (No Self-Hosting, No SDK, Instant Setup)',
  description:
    'Langfuse requires a self-hosted server or $59/mo Cloud. LLMeter is the open-source alternative — paste a read-only API key and get cost dashboards in 30 seconds. Free tier.',
  metadataBase: new URL('https://www.llmeter.org'),
  openGraph: {
    title: 'Migrate from Langfuse to LLMeter',
    description:
      'Skip the self-hosted server. LLMeter tracks LLM costs with a read-only API key — no SDK, no proxy, no infrastructure.',
    url: 'https://www.llmeter.org/migrate/langfuse',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Langfuse alternative — LLMeter',
    description:
      'Open-source LLM cost monitoring. No Langfuse server, no SDK, no infrastructure overhead.',
  },
  alternates: {
    canonical: 'https://www.llmeter.org/migrate/langfuse',
  },
};

const COMPARISON = [
  { feature: 'Setup method', langfuse: 'Self-hosted server or Cloud ($59/mo)', llmeter: 'Read-only API key (no code changes)' },
  { feature: 'Time to first dashboard', langfuse: '30–90 min (Docker/K8s) or Cloud signup', llmeter: '30 seconds' },
  { feature: 'Infrastructure required', langfuse: 'PostgreSQL + Redis + app server', llmeter: 'None' },
  { feature: 'Code changes required', langfuse: 'Yes (SDK + LANGFUSE_* env vars)', llmeter: 'None' },
  { feature: 'Open source', langfuse: 'Yes (MIT)', llmeter: 'Yes (AGPL-3.0)' },
  { feature: 'Self-hosting cost', langfuse: '$50–100/mo infra (typical small team)', llmeter: 'Free (no server needed)' },
  { feature: 'Multi-provider support', langfuse: 'Whatever SDK supports', llmeter: 'OpenAI, Anthropic, Google AI, Mistral, DeepSeek, Groq, Cohere, Together AI, Fireworks AI, Perplexity AI + more' },
  { feature: 'Prompt/data access', langfuse: 'Captures prompts, completions, traces', llmeter: 'Never sees prompts' },
  { feature: 'Tracing / eval features', langfuse: 'Yes (full LLMOps suite)', llmeter: 'No (cost-focused, on purpose)' },
  { feature: 'Per-customer attribution', langfuse: 'Via session/user metadata', llmeter: 'Built-in' },
  { feature: 'Flat pricing', langfuse: 'Usage-based (events) above free tier', llmeter: 'Flat tier (Free / $19 / $49)' },
];

const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Sign up for LLMeter',
    description: 'Create a free account. No credit card, no server, no Docker required.',
    icon: KeyRound,
  },
  {
    step: 2,
    title: 'Paste a read-only API key',
    description: 'Generate a read-only key for OpenAI, Anthropic, or any supported provider and paste it in. LLMeter pulls cost data directly — nothing in your codebase changes.',
    icon: Code2,
  },
  {
    step: 3,
    title: 'Remove the Langfuse SDK',
    description: 'Uninstall langfuse and remove LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY env vars. If you only used Langfuse for cost tracking, you\'re done. Keep it if you rely on tracing or eval features.',
    icon: RefreshCw,
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is LLMeter a full Langfuse replacement?',
    answer:
      'For LLM cost monitoring, yes. For distributed tracing, prompt evaluation, dataset management, and LLM debugging — no. LLMeter is intentionally scoped to the cost layer. If your main use of Langfuse is "how much am I spending and on which models," LLMeter replaces it cleanly without the infrastructure overhead. Keep Langfuse for evals and traces if those matter to you.',
  },
  {
    question: 'Why would I move off Langfuse for cost monitoring?',
    answer:
      'Three common reasons: (1) Self-hosting Langfuse adds $50–100/mo in infrastructure (Postgres, Redis, app server) just to watch a spend number. (2) The SDK requires code changes and captures prompt content — some teams have compliance constraints that make that uncomfortable. (3) LLMeter\'s setup is 30 seconds vs 30–90 minutes for a Langfuse deployment.',
  },
  {
    question: 'Does LLMeter capture my prompts or completions?',
    answer:
      'No. LLMeter reads usage and billing data from your provider\'s read-only API. It never proxies live calls and never sees prompt text or completion content. Langfuse\'s tracing model captures prompts and outputs by design — LLMeter\'s does not.',
  },
  {
    question: 'How does infrastructure cost compare?',
    answer:
      'Langfuse self-hosted: $50–100/mo minimum for a production-grade stack (managed Postgres ~$25, Redis ~$15, app server ~$20+, backups, monitoring). Langfuse Cloud: free up to 50K events/mo, then $59/mo for teams. LLMeter: $0 infrastructure — you pay $0 (free plan) or $19/$49/mo flat with no separate infra.',
  },
  {
    question: 'Does LLMeter work if I\'m already using Langfuse for tracing?',
    answer:
      'Yes — you can run both in parallel. Keep Langfuse for traces and evals; add LLMeter for cost dashboards, budget alerts, and multi-provider spend attribution. They don\'t conflict because LLMeter uses read-only API keys, not SDK instrumentation.',
  },
  {
    question: 'Is LLMeter open source?',
    answer:
      'Yes. AGPL-3.0. You can inspect the source, self-host it (though you likely won\'t need to — there\'s no server to run), and contribute. The entire cost-monitoring stack runs serverless on Vercel with a hosted Supabase database.',
  },
];

export default function MigrateLangfuse() {
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
              Langfuse &rarr; LLMeter
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              LLM cost monitoring{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                without the server
              </span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Langfuse is a powerful LLMOps platform — but self-hosting it costs $50–100/mo in infrastructure before you pay for a single API call. LLMeter tracks costs with a read-only key, no server required, in 30 seconds.
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
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Why teams switch for cost monitoring</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Langfuse is excellent for tracing, evals, and prompt management. For pure cost monitoring the setup overhead is significant.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Server,
                  title: 'Infrastructure overhead',
                  description: 'Langfuse self-hosting needs PostgreSQL, Redis, and an app server. A minimal production stack costs $50–100/mo before you track a single dollar of LLM spend.',
                },
                {
                  icon: Package,
                  title: 'SDK + code changes',
                  description: 'Langfuse requires the SDK and LANGFUSE_* env vars in every service. LLMeter uses a read-only provider API key — nothing changes in your application code.',
                },
                {
                  icon: Shield,
                  title: 'Tracing captures prompts',
                  description: 'Langfuse\'s tracing model captures prompts and completions by design. LLMeter only reads billing data from the provider\'s read-only API — your prompts never leave your stack.',
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
              No Docker. No Postgres. No SDK install. Your application code stays unchanged.
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

        {/* Cost comparison callout */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <div className="rounded-xl border bg-gradient-to-br from-muted/30 to-muted/10 p-8 md:p-12">
              <div className="flex items-start gap-4 mb-6">
                <DollarSign className="h-8 w-8 text-primary shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">The cost of monitoring costs</h2>
                  <p className="text-muted-foreground">Self-hosting Langfuse to save money on LLM bills can end up costing more than the LLM spend itself at early stages.</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-muted-foreground">Langfuse self-hosted (typical small team)</h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Managed PostgreSQL: ~$25/mo',
                      'Redis: ~$15/mo',
                      'App server (2vCPU): ~$20/mo',
                      'Backups + monitoring: ~$10/mo',
                      'Engineer setup time: 4–8h (one-time)',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                        {item}
                      </li>
                    ))}
                    <li className="flex items-center gap-2 font-semibold pt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      Total: ~$70/mo + setup time
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-primary">LLMeter</h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      'No database to provision',
                      'No Redis to manage',
                      'No server to deploy',
                      'No backups to configure',
                      'Setup time: 30 seconds',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-primary">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                    <li className="flex items-center gap-2 font-semibold pt-1 text-primary">
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      Total: $0 (free plan) or $19/mo flat
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="comparison" className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Langfuse vs LLMeter</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              For cost monitoring specifically — the comparison most teams care about.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Langfuse</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">LLMeter</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.langfuse}</td>
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
              Langfuse Cloud pricing: free up to 50K events/mo, then $59/mo (Team, Apr 2026). LLMeter: free (1 provider) / $19 (Pro) / $49 (Team).
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
              Track LLM costs without standing up a server.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Free for 1 provider, forever. $19/mo for unlimited providers. $49/mo for the whole team. No infrastructure, no SDK, no prompt capture.
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
                { '@type': 'ListItem', position: 2, name: 'Migrate from Langfuse', item: 'https://www.llmeter.org/migrate/langfuse' },
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
              name: 'Migrate from Langfuse to LLMeter',
              description: 'Open-source alternative to Langfuse for LLM cost monitoring without self-hosting overhead, SDK instrumentation, or prompt capture.',
              url: 'https://www.llmeter.org/migrate/langfuse',
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
              Open-source AI cost monitoring for developers. Track spend across OpenAI, Anthropic, Google AI, Mistral, DeepSeek &amp; more.
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
