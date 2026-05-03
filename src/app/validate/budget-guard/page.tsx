import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircuitBoard,
  Flame,
  Gauge,
  Lock,
  Mail,
  ShieldCheck,
  Siren,
  X,
  Zap,
} from 'lucide-react';
import { MobileNav } from '@/components/mobile-nav';
import type { Metadata } from 'next';
import { WaitlistForm } from './waitlist-form';

const PAGE_URL = 'https://llmeter.org/validate/budget-guard';

export const metadata: Metadata = {
  title: 'LLM Budget Guard — Hard Cutoffs Before Your Agents Burn You',
  description:
    'Stop AI agents from spiraling into a $47K bill or getting your provider account banned. Hard token limits with provider-side enforcement — not just alerts. Join the waitlist.',
  metadataBase: new URL('https://llmeter.org'),
  openGraph: {
    title: 'LLM Budget Guard — Hard Cutoffs Before Your Agents Burn You',
    description:
      'Alerts won\'t stop a runaway agent at 3 AM. Budget Guard enforces hard token cutoffs across OpenAI, Anthropic & DeepSeek before bans or surprise invoices.',
    url: PAGE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Budget Guard — Hard Cutoffs Before Your Agents Burn You',
    description:
      'Alerts aren\'t enforcement. Budget Guard cuts off agents at the provider before they burn you. Join the waitlist.',
  },
  alternates: {
    canonical: PAGE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const PROBLEM_CARDS = [
  {
    icon: Flame,
    title: '$47,000 in 11 days',
    body:
      'Four AI agents looping on a broken retry policy. By the time the Slack alert fired on Monday, the bill was already past five figures. Alerts notice — they don\'t stop.',
  },
  {
    icon: Ban,
    title: '110 accounts banned overnight',
    body:
      'Belo (agritech) had 110 OpenAI accounts terminated for misuse spikes their dashboards never flagged in time. No appeals. No data export. Provider trust is now infrastructure risk.',
  },
  {
    icon: Zap,
    title: 'DeepSeek v4 is 5× cheaper',
    body:
      'Cheaper inference means more agents, longer chains, riskier loops. The blast radius of a runaway is bigger every quarter — even when the per-token price is lower.',
  },
];

const FEATURE_CARDS = [
  {
    icon: Lock,
    title: 'Hard cutoffs, not just alerts',
    body:
      'Set a daily/monthly token budget. We rotate down provider keys or pause the org at the API gateway when you hit it. Agents stop. The invoice stops.',
  },
  {
    icon: ShieldCheck,
    title: 'Pre-ban anomaly detection',
    body:
      'Detect the spend curves that precede provider terminations — repeated rate-limit errors, abnormal usage clusters, sudden 10× volume — and freeze before TOS triggers.',
  },
  {
    icon: CircuitBoard,
    title: 'Multi-provider, one ceiling',
    body:
      'OpenAI, Anthropic, DeepSeek, OpenRouter. One enforced budget across all of them. No more juggling three dashboards while a fourth provider drains.',
  },
  {
    icon: Gauge,
    title: 'Per-agent + per-key limits',
    body:
      'Cap individual agents, services, or API keys. A misbehaving worker can\'t take down your whole budget — just its own slice.',
  },
  {
    icon: Siren,
    title: 'Kill switch in one click',
    body:
      'A panic button that disables every connected provider key in under 2 seconds. For when you see the spike and don\'t have time to log into four dashboards.',
  },
  {
    icon: Bell,
    title: 'Alerts you can still trust',
    body:
      'Slack, email, webhook — but as a status, not a safety net. Enforcement does the saving; alerts just keep you informed.',
  },
];

const COMPARISON = [
  { feature: 'Stops a 3 AM token spiral', alerts: 'No', guard: 'Yes — provider-side cutoff' },
  { feature: 'Prevents account ban from misuse spike', alerts: 'No', guard: 'Yes — pauses before TOS triggers' },
  { feature: 'Multi-provider single ceiling', alerts: 'Per dashboard', guard: 'One budget across all' },
  { feature: 'Per-agent budget enforcement', alerts: 'Rare', guard: 'Built in' },
  { feature: 'Setup time', alerts: 'Hours of dashboarding', guard: 'Minutes (read-only key + budget)' },
  { feature: 'Open source', alerts: 'Sometimes', guard: 'Yes — AGPL, audit anything' },
];

const FAQ_ITEMS = [
  {
    question: 'How is this different from a Slack alert at 80% of budget?',
    answer:
      'An alert tells you the fire started. Budget Guard puts it out. We integrate with each provider\'s API to revoke or rate-limit your keys when limits are hit — so a runaway agent at 3 AM stops automatically instead of escalating into a $47K invoice or a provider ban.',
  },
  {
    question: 'Why would I get banned by an LLM provider?',
    answer:
      'Providers terminate accounts for sudden usage spikes, suspicious traffic patterns, or repeated TOS-adjacent behavior — often with no human review. Belo (agritech) lost 110 OpenAI accounts in a single sweep. As more teams run autonomous agents on cheaper models like DeepSeek v4, the risk of triggering automated enforcement keeps growing.',
  },
  {
    question: 'How does the cutoff actually work?',
    answer:
      'You connect each provider with a key that has billing/admin scope. When you hit a budget threshold, Budget Guard rotates the active sub-keys, pauses the org, or applies provider-native rate limits — depending on what each platform exposes. The goal: stop spend at the API boundary, not at your application code.',
  },
  {
    question: 'What providers will be supported at launch?',
    answer:
      'OpenAI, Anthropic, DeepSeek, and OpenRouter — the same set LLMeter monitors today. We\'re prioritizing providers based on waitlist signal, so if you need others (Google, Mistral, AWS Bedrock), tell us when you sign up.',
  },
  {
    question: 'Is this open source?',
    answer:
      'Yes. Like the rest of LLMeter, Budget Guard will ship under AGPL-3.0. You can self-host, audit the cutoff logic, and verify exactly what runs against your provider keys.',
  },
  {
    question: 'When will this ship?',
    answer:
      'We\'re validating demand now. Waitlist signups directly determine launch timing — if we hit our threshold this month, the alpha ships in the next sprint. Early signups get founding-team pricing locked for life.',
  },
];

const SOCIAL_PROOF = [
  { value: '$47K', label: 'lost in 11 days to one runaway agent loop' },
  { value: '110', label: 'OpenAI accounts banned overnight at Belo' },
  { value: '5×', label: 'cheaper inference (DeepSeek v4) — bigger blast radius' },
];

export default function ValidateBudgetGuard() {
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
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-24">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Badge variant="secondary" className="rounded-2xl px-4 py-1.5 text-sm">
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Validation — early access
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Alerts won&apos;t stop your{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-300 bg-clip-text text-transparent">
                3 AM token spiral
              </span>
            </h1>
            <p className="max-w-[44rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              LLM Budget Guard enforces <span className="font-semibold text-foreground">hard cutoffs at the provider</span> — across OpenAI, Anthropic, and DeepSeek — before runaway agents burn $47K in 11 days or get your account terminated.
            </p>

            <div id="waitlist" className="w-full pt-6">
              <WaitlistForm ctaLabel="Get Early Access" />
            </div>

            <p className="text-xs text-muted-foreground/60 pt-2">
              Founding-team pricing locked for life. No spam, ever.
            </p>
          </div>
        </section>

        {/* Social proof / stats */}
        <section className="container py-8 md:py-12">
          <div className="mx-auto grid max-w-[64rem] gap-4 md:grid-cols-3">
            {SOCIAL_PROOF.map((item) => (
              <div key={item.label} className="glass-card p-6 text-center">
                <div className="text-4xl font-bold text-primary">{item.value}</div>
                <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The problem */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">The bills keep landing on Mondays.</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[44rem] mx-auto mb-12">
              Three real failure modes we keep hearing from teams shipping autonomous agents. None of them get caught by an alert thresholds dashboard.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {PROBLEM_CARDS.map((item) => (
                <div key={item.title} className="glass-card p-6 space-y-3">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why now */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[48rem] space-y-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">Why this is different now</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Until 2025, LLM cost was a finance problem. You overshot budget, you negotiated with your CFO, you moved on. Two things broke that calm:
            </p>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-semibold text-foreground">Agents shipped to production.</span> A loop is no longer a developer mistake on localhost — it&apos;s a Tuesday-night incident with a 6-figure invoice.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-semibold text-foreground">Providers got aggressive about bans.</span> Belo, multiple agritech teams, and a long tail of small startups have lost production OpenAI access overnight, with no human in the loop. Spend monitoring is now access risk monitoring.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <span className="font-semibold text-foreground">Cheaper models, bigger blast radius.</span> DeepSeek v4 at 5× lower cost means engineers ship longer chains, more agents, more retries — and the surprise bill scales with all of them.
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground text-lg leading-relaxed pt-2">
              An alert at 80% of budget was already too late in 2024. In 2026, it&apos;s a liability.
            </p>
          </div>
        </section>

        {/* What it does */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">What Budget Guard does</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Enforcement, not observation. Built on top of the same read-only-key model LLMeter uses today.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURE_CARDS.map((item) => (
                <div key={item.title} className="glass-card p-6 space-y-3">
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="container py-12 md:py-20 border-t">
          <div className="mx-auto max-w-[64rem]">
            <h2 className="text-center text-3xl font-bold md:text-4xl mb-4">Alerts vs. Budget Guard</h2>
            <p className="text-center text-muted-foreground text-lg max-w-[42rem] mx-auto mb-12">
              Side-by-side: what you have today vs. what enforcement looks like.
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Scenario</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Alerts (today)</th>
                    <th className="px-4 py-3 text-left font-semibold text-primary">Budget Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <X className="h-3.5 w-3.5 text-destructive" /> {row.alerts}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {row.guard}
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
                  <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[48rem] rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stop the next $47K invoice before it starts.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Join the waitlist. We email you the day Budget Guard ships — and lock founding-team pricing for life.
            </p>
            <WaitlistForm ctaLabel="Join the Waitlist" />
          </div>
        </section>

        {/* Try LLMeter today (exit hatch for visitors not ready for waitlist) */}
        <section className="container pb-16 md:pb-24">
          <div className="mx-auto max-w-[48rem] rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6 md:p-8 text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
              Need cost visibility today?
            </p>
            <h3 className="text-xl md:text-2xl font-semibold">
              Budget Guard ships soon. <span className="text-muted-foreground">LLMeter is live now.</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-[36rem] mx-auto">
              Track LLM spend across OpenAI, Anthropic, DeepSeek &amp; OpenRouter — open-source, free forever for 1 provider, 30-second setup with a read-only API key.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="h-11 px-6 text-sm font-semibold bg-primary hover:bg-primary/90 text-white"
                asChild
              >
                <Link href="/login">
                  Try LLMeter Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-11 px-6 text-sm" asChild>
                <Link href="/">Learn more</Link>
              </Button>
            </div>
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
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://llmeter.org' },
                { '@type': 'ListItem', position: 2, name: 'Validate Budget Guard', item: PAGE_URL },
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
              name: 'LLM Budget Guard — Hard Cutoffs Before Your Agents Burn You',
              description:
                'Hard token cutoffs across OpenAI, Anthropic, and DeepSeek to prevent runaway agents and provider bans.',
              url: PAGE_URL,
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
            &copy; {new Date().getFullYear()} LLMeter. All rights reserved.
          </p>
          <span className="text-[10px] text-muted-foreground/30 select-none">
            {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'}
          </span>
        </div>
      </footer>
    </div>
  );
}
