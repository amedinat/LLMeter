import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllModels } from '@/data/model-pricing';
import { CostComparison } from './cost-comparison';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LLM Cost Comparison Calculator — Compare Model Pricing | LLMeter',
  description:
    'Compare monthly API cost across LLM models side-by-side. Pick up to 4 models, enter your expected token volume, and see real-time cost — powered by the same OpenRouter-sourced catalog as LLMeter.',
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: 'https://www.llmeter.org/models/compare' },
  openGraph: {
    title: 'LLM Cost Comparison Calculator — LLMeter',
    description:
      'Compare monthly API cost across LLM models. Pick up to 4, set your token volume, see real cost.',
    url: 'https://www.llmeter.org/models/compare',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Cost Comparison Calculator — LLMeter',
    description: 'Compare monthly API cost across LLM models in seconds.',
    images: ['/og-image.png'],
  },
};

export default function ModelCompareePage() {
  const models = getAllModels();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
      { '@type': 'ListItem', position: 2, name: 'Models', item: 'https://www.llmeter.org/models' },
      { '@type': 'ListItem', position: 3, name: 'Compare', item: 'https://www.llmeter.org/models/compare' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="hidden font-bold text-cyan-400 sm:inline-block">LLMeter</span>
              </Link>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link href="/#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">How It Works</Link>
                <Link href="/#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
                <Link href="/models" className="transition-colors hover:text-foreground/80 text-foreground">Model Pricing</Link>
                <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
                <Link href="/#faq" className="transition-colors hover:text-foreground/80 text-foreground/60">FAQ</Link>
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <Link href="/" className="md:hidden font-bold text-cyan-400">LLMeter</Link>
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
          <div className="container max-w-screen-xl py-10 md:py-16">
            <Link
              href="/models"
              className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to all models
            </Link>

            <div className="mb-10 max-w-2xl">
              <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                LLM Cost Comparison{' '}
                <span className="text-cyan-400">Calculator</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Pick up to 4 models, set your expected monthly token volume, and see real
                cost side-by-side. Pricing is sourced from the same catalog LLMeter uses
                to track your actual spend ({models.length} models from OpenAI, Anthropic,
                Google AI, Mistral, DeepSeek, and OpenRouter).
              </p>
            </div>

            <CostComparison models={models} />

            <div className="mt-16 rounded-xl border border-border bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-8 text-center">
              <h2 className="mb-2 text-2xl font-bold">Estimates are useful — actuals are critical</h2>
              <p className="mb-6 text-muted-foreground">
                This calculator estimates cost based on assumed token volume. LLMeter
                connects to your provider APIs and shows what you&apos;re actually spending —
                across every model, in one dashboard.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Track actual spend free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    View pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-border py-6">
          <div className="container max-w-screen-xl space-y-3 text-center text-sm text-muted-foreground">
            <p>
              Prices are sourced from provider billing APIs and updated regularly.{' '}
              <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
                LLMeter
              </Link>{' '}
              — open-source LLM cost monitoring. &middot;{' '}
              <a
                href="https://simplifai.tools"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                A Simplifai product
              </a>
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">Privacy</Link>
              <Link href="/refund" className="hover:text-foreground underline-offset-4 hover:underline">Refund</Link>
              <a href="mailto:hello@llmeter.org" className="hover:text-foreground underline-offset-4 hover:underline">Contact</a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
