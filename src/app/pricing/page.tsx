import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PLANS } from '@/config/plans';

const VISIBLE_PLANS = [PLANS.free, PLANS.pro, PLANS.team, PLANS.enterprise];

export const metadata = {
  title: 'Pricing — LLMeter',
  description:
    'Simple, transparent pricing for AI cost monitoring. Free tier included.',
};

export default function PricingPage() {
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
              <Link
                href="/#features"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="https://github.com/amedinat/LLMeter"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                GitHub
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none" />
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
        <section className="container py-12 md:py-20">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <h1 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Simple, transparent pricing
            </h1>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Start free. Upgrade when you need more providers, longer retention,
              or team features.
            </p>
          </div>
        </section>

        {/* Plans grid */}
        <section className="container pb-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-[80rem] mx-auto">
            {VISIBLE_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col${plan.highlighted ? ' relative border-primary shadow-lg' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.label}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold mt-4">
                    {plan.price === null ? (
                      <span>Custom</span>
                    ) : plan.price === 0 ? (
                      <span>
                        $0
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      </span>
                    ) : (
                      <span>
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /month
                        </span>
                      </span>
                    )}
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.trialDays}-day free trial
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {plan.featureList.map((feat) => (
                      <li key={feat} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 shrink-0 text-primary" />{' '}
                        {feat}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant={plan.ctaVariant} className="w-full" asChild>
                    <Link href={plan.price === null ? 'mailto:hello@llmeter.org' : '/login'}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="container pb-16">
          <div className="mx-auto max-w-[42rem] space-y-8">
            <h2 className="text-2xl font-bold text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Can I try Pro before paying?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes! Pro comes with a {PLANS.pro.trialDays}-day free trial. No
                  credit card required to start.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">What happens when my trial ends?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  If you haven&apos;t added a payment method, your account will be
                  downgraded to the Free plan. Your data is preserved but access
                  to premium features is paused.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Can I change plans later?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Absolutely. Upgrade or downgrade at any time from your settings
                  page. Changes are prorated so you only pay for what you use.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Yes. API keys are encrypted at rest using AES-256-GCM. We never
                  store or log your raw API keys.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{' '}
            <a
              href="https://github.com/amedinat/LLMeter"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              LLMeter Team
            </a>
            . The source code is available on{' '}
            <a
              href="https://github.com/amedinat/LLMeter"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
