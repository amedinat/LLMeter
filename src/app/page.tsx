import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  MessageCircleQuestion,
  Shield,
  TrendingDown,
  Zap,
  LineChart,
} from 'lucide-react';
import { PLANS } from '@/config/plans';
import { MobileNav } from '@/components/mobile-nav';

const VISIBLE_PLANS = [PLANS.free, PLANS.pro, PLANS.team] as const;

const FAQ_ITEMS = [
  {
    question: 'Can you read my code or prompts?',
    answer: 'No. We only access usage and billing data through read-only API keys. We never see your prompts, completions, or code.',
  },
  {
    question: 'Is it safe to paste my API key?',
    answer: 'Yes. All keys are encrypted at rest using AES-256-GCM. We never store them in plain text, and you can use read-only keys for maximum safety.',
  },
  {
    question: 'What happens if I cancel?',
    answer: 'Your Free plan remains active forever. You never lose access to your usage data.',
  },
  {
    question: 'Which providers are supported?',
    answer: 'OpenAI, Anthropic, DeepSeek, and OpenRouter. More coming soon.',
  },
  {
    question: 'How long does setup take?',
    answer: 'Under 30 seconds. Paste a read-only API key, and your dashboard populates instantly — no SDK, no code changes, no deployment.',
  },
];

export default function HomePage() {
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
              <Link href="#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">How It Works</Link>
              <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
              <Link href="#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-white" asChild>
                <Link href="/login">Start Free</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Helicone Migration Banner */}
        <div className="w-full bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-cyan-500/10 border-b border-cyan-500/20">
          <div className="container flex items-center justify-center gap-3 py-2.5 text-sm">
            <span className="hidden sm:inline font-medium text-cyan-400">Migrating from Helicone?</span>
            <span className="text-muted-foreground">LLMeter is the open-source alternative — set up in 30 seconds, no SDK needed.</span>
            <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 whitespace-nowrap">
              Try Free &rarr;
            </Link>
          </div>
        </div>

        {/* Hero */}
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Link
              href="https://github.com/amedinat/LLMeter"
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-1.5 text-sm font-medium"
              target="_blank"
            >
              Open Source on GitHub
            </Link>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Your AI Costs Are{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">Out of Control.</span>
              <br />
              <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground/90">Fix it in 30 seconds.</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Connect your OpenAI, Anthropic, DeepSeek, or OpenRouter key. Get a unified dashboard with real costs, budget alerts, and optimization insights — no SDK, no code changes.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-white" asChild>
                <Link href="/login">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com/amedinat/LLMeter" target="_blank">View on GitHub</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/70">Free forever for 1 provider. Upgrade anytime.</p>
          </div>

          {/* Hero Image */}
          <div className="container flex justify-center px-4 pt-4 md:pt-8">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border shadow-2xl" style={{ perspective: '1000px' }}>
              <div style={{ transform: 'rotateX(2deg)' }}>
                <Image
                  src="/hero-dashboard.jpg"
                  alt="LLMeter Dashboard — AI cost tracking with daily spend chart, provider breakdown, and budget alerts"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <Badge variant="secondary" className="mb-2">Setup in under 30 seconds</Badge>
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Three steps. Zero code changes.
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              No SDK to install. No endpoints to instrument. Just paste a key and go.
            </p>
          </div>
          <div className="mx-auto mt-12 grid gap-8 md:grid-cols-3 max-w-[64rem]">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <KeyRound className="h-7 w-7 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-cyan-400">Step 1</div>
              <h3 className="text-lg font-semibold">Paste your API key</h3>
              <p className="text-sm text-muted-foreground">
                Use a read-only key from OpenAI, Anthropic, DeepSeek, or OpenRouter. AES-256 encrypted at rest.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <LayoutDashboard className="h-7 w-7 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-cyan-400">Step 2</div>
              <h3 className="text-lg font-semibold">See your real costs</h3>
              <p className="text-sm text-muted-foreground">
                Your dashboard populates instantly with spend by model, daily trends, and cost breakdowns.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <Shield className="h-7 w-7 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-cyan-400">Step 3</div>
              <h3 className="text-lg font-semibold">Set alerts & optimize</h3>
              <p className="text-sm text-muted-foreground">
                Create budget alerts so you never get a surprise bill. Get suggestions to cut costs.
              </p>
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-white" asChild>
              <Link href="/login">
                Try It Free Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Pain Point / Problem */}
        <section className="container py-8 md:py-12">
          <div className="mx-auto max-w-[64rem] rounded-xl border bg-muted/30 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold">
                  Most teams discover they&apos;re overspending on AI <span className="text-cyan-400">after</span> the bill arrives.
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  You&apos;re using GPT-4o in production, Claude for analysis, maybe DeepSeek for experiments. Each provider has a different billing page, different formats, different cycles. By the time you notice a spike, the damage is done.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-medium">Scattered billing dashboards</p>
                    <p className="text-sm text-muted-foreground">3+ tabs open just to understand your total AI spend</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-medium">No budget guardrails</p>
                    <p className="text-sm text-muted-foreground">One runaway job can blow your monthly budget overnight</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingDown className="mt-1 h-5 w-5 shrink-0 text-red-400" />
                  <div>
                    <p className="font-medium">Invisible cost per model</p>
                    <p className="text-sm text-muted-foreground">Is GPT-4o-mini actually cheaper for your use case? You can&apos;t tell.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Everything you need to control AI costs
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              One dashboard. All providers. Real-time visibility.
            </p>
          </div>
          <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card className="glass-card">
              <CardHeader>
                <LayoutDashboard className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>Unified Dashboard</CardTitle>
                <CardDescription>
                  See OpenAI + Anthropic + DeepSeek spend in one place. No more switching between billing pages.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>Budget Alerts</CardTitle>
                <CardDescription>
                  Set daily or monthly spend limits. Get notified before a runaway job blows your budget.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>OpenRouter Support</CardTitle>
                <CardDescription>
                  Track usage across 500+ models with a single OpenRouter key. Pro feature.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <LineChart className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>Anomaly Detection</CardTitle>
                <CardDescription>
                  Spot unexpected cost spikes before they escalate. Get alerts when spend deviates from normal.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <BarChart3 className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>Cost Breakdown by Model</CardTitle>
                <CardDescription>
                  See exactly which models and endpoints are driving your costs. Identify savings opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <Lock className="h-10 w-10 mb-2 text-cyan-400" />
                <CardTitle>Enterprise-grade Security</CardTitle>
                <CardDescription>
                  API keys encrypted at rest with AES-256-GCM. Read-only keys supported. Your data stays yours.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Social Proof / Trust */}
        <section className="container py-8 md:py-12">
          <div className="mx-auto flex max-w-[64rem] flex-col items-center gap-8">
            <h2 className="text-center text-lg font-medium text-muted-foreground">
              Works with the providers you already use
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Globe className="mr-2 h-4 w-4" /> OpenAI
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Globe className="mr-2 h-4 w-4" /> Anthropic
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Globe className="mr-2 h-4 w-4" /> DeepSeek
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Globe className="mr-2 h-4 w-4" /> OpenRouter
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">4</span>
                <span>Providers supported</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">AES-256</span>
                <span>Key encryption</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">30s</span>
                <span>Setup time</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">$0</span>
                <span>To get started</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Simple, transparent pricing
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Start free. Upgrade when you need unlimited providers or team features.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-8 max-w-[64rem] mx-auto">
            {VISIBLE_PLANS.map((plan) => (
              <Card key={plan.id} className={`flex flex-col glass-card${plan.highlighted ? ' relative border-cyan-500' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-cyan-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.label}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    ${plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-sm text-cyan-400 mt-1 font-medium">
                      {plan.trialDays}-day free trial included
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {plan.featureList.map((feat) => (
                      <li key={feat} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-cyan-400" /> {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant={plan.ctaVariant} className={`w-full${plan.highlighted ? ' bg-cyan-500 hover:bg-cyan-400 text-white' : ''}`} asChild>
                    <Link href="/login">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <MessageCircleQuestion className="h-10 w-10 text-muted-foreground" />
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mx-auto mt-8 max-w-[42rem] divide-y">
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
        </section>

        {/* Final CTA */}
        <section className="container py-12 md:py-20">
          <div className="mx-auto max-w-[48rem] rounded-xl border bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stop guessing. Start tracking.
            </h2>
            <p className="text-muted-foreground text-lg max-w-[36rem] mx-auto">
              Join developers who switched from checking 3 billing pages to one dashboard. Setup takes 30 seconds. Free forever for 1 provider.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold bg-cyan-500 hover:bg-cyan-400 text-white" asChild>
                <Link href="/login">
                  Start Monitoring for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">No credit card required. Free plan never expires.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 md:py-12">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4 max-w-[64rem] mx-auto">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="https://github.com/amedinat/LLMeter" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
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
