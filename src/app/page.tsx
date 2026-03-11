import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Check, ChevronDown, Globe, LayoutDashboard, Lock, Mail, MessageCircleQuestion, Shield, Zap, LineChart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PLANS } from '@/config/plans';

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
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
              <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
              <Link href="#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
              <Link href="https://github.com/amedinat/LLMeter" className="transition-colors hover:text-foreground/80 text-foreground/60" target="_blank">GitHub</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search later */}
            </div>
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
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <Link
              href="https://github.com/amedinat/LLMeter"
              className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
              target="_blank"
            >
              Open Source on GitHub
            </Link>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Stop Guessing Your AI Bill.{' '}
              <span className="text-primary">Full Visibility in 30 Seconds.</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Connect your OpenAI, Anthropic, DeepSeek, or OpenRouter API keys. Get a unified dashboard with real costs, budget alerts, and usage insights in minutes.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
                <Link href="/login">Start Free &mdash; No Credit Card</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com/amedinat/LLMeter" target="_blank">View on GitHub</Link>
              </Button>
            </div>
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

        {/* Features */}
        <section id="features" className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to manage AI costs effectively.
            </p>
          </div>
          <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <Card>
              <CardHeader>
                <LayoutDashboard className="h-10 w-10 mb-2" />
                <CardTitle>Unified Dashboard</CardTitle>
                <CardDescription>
                  View all your AI usage in one place. No more switching tabs between OpenAI and Anthropic.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2" />
                <CardTitle>Budget Alerts</CardTitle>
                <CardDescription>
                  Set daily or monthly spend limits. Get notified before you get a surprise bill.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-2" />
                <CardTitle>OpenRouter Support</CardTitle>
                <CardDescription>
                  Track usage across 500+ models with a single OpenRouter key (Pro feature).
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <LineChart className="h-10 w-10 mb-2" />
                <CardTitle>Usage Trends</CardTitle>
                <CardDescription>
                  Analyze token usage over time. Spot anomalies and unexpected spikes instantly.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 mb-2" />
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                  See exactly which models and endpoints are driving your costs.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Lock className="h-10 w-10 mb-2" />
                <CardTitle>Secure Storage</CardTitle>
                <CardDescription>
                  Your API keys are encrypted at rest using AES-256-GCM. We prioritize your security.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Trust / Social Proof */}
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
                <span className="text-2xl font-bold text-foreground">100%</span>
                <span>Open Source</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-foreground">30s</span>
                <span>Setup time</span>
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
              Choose the plan that&apos;s right for you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-8 max-w-[64rem] mx-auto">
            {VISIBLE_PLANS.map((plan) => (
              <Card key={plan.id} className={`flex flex-col${plan.highlighted ? ' relative border-primary' : ''}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.label}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    ${plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {plan.featureList.map((feat) => (
                      <li key={feat} className="flex items-center">
                        <Check className="mr-2 h-4 w-4" /> {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant={plan.ctaVariant} className="w-full" asChild>
                    <Link href="/login">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {/* Bottom CTA */}
          <div className="mt-12 flex justify-center">
            <Button size="lg" className="h-12 px-8 text-base font-semibold" asChild>
              <Link href="/login">Start Monitoring for Free</Link>
            </Button>
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
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> hello@llmeter.org</span>
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
