import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Check, LayoutDashboard, Shield, Zap, ArrowRight, LineChart } from 'lucide-react';

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
              <Link href="https://github.com/amedinat/LLMeter" className="transition-colors hover:text-foreground/80 text-foreground/60">GitHub</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Add search later */}
            </div>
            <nav className="flex items-center space-x-2">
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
              Control your AI spend across all providers.
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Connect your OpenAI, Anthropic, DeepSeek, or OpenRouter API keys. Get a unified dashboard with real costs, budget alerts, and usage insights in minutes.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com/amedinat/LLMeter" target="_blank">View on GitHub</Link>
              </Button>
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
                <ArrowRight className="h-10 w-10 mb-2" />
                <CardTitle>Secure Storage</CardTitle>
                <CardDescription>
                  Your API keys are encrypted at rest using AES-256-GCM. We prioritize your security.
                </CardDescription>
              </CardHeader>
            </Card>
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
            {/* Free Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>For individuals getting started</CardDescription>
                <div className="text-3xl font-bold mt-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> 1 Provider (except OpenRouter)</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> 30-day data retention</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> 1 Budget Alert</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Real cost tracking</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/login">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="flex flex-col relative border-primary">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For power users and developers</CardDescription>
                <div className="text-3xl font-bold mt-4">$19<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Unlimited Providers</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> 1-year data retention</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Unlimited Alerts & Anomaly Detection</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> OpenRouter Integration</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/login">Start Free Trial</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Team Plan */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>For startups and small teams</CardDescription>
                <div className="text-3xl font-bold mt-4">$49<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Everything in Pro</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Unlimited data retention</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Team members (up to 5)</li>
                  <li className="flex items-center"><Check className="mr-2 h-4 w-4" /> Priority Support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Contact Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by <a href="https://github.com/amedinat/LLMeter" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">LLMeter Team</a>.
            The source code is available on <a href="https://github.com/amedinat/LLMeter" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">GitHub</a>.
          </p>
          <span className="text-[10px] text-muted-foreground/30 select-none">
            {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'}
          </span>
        </div>
      </footer>
    </div>
  );
}
