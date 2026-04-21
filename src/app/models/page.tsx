import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllModels } from '@/data/model-pricing';
import { ModelsTable } from './models-table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LLM Model Pricing Comparison 2026 — LLMeter',
  description:
    'Compare LLM API pricing across 128+ models from OpenAI, Anthropic, Google AI, Mistral, DeepSeek, and OpenRouter. Input and output token costs per 1M tokens, updated 2026.',
  openGraph: {
    title: 'LLM Model Pricing Comparison 2026 — LLMeter',
    description:
      'Compare input and output token pricing across 128+ models from OpenAI, Anthropic, Google AI, Mistral, DeepSeek, and OpenRouter.',
    url: 'https://llmeter.org/models',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Model Pricing Comparison 2026 — LLMeter',
    description: 'Compare LLM API pricing across 128+ models. Updated 2026.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://llmeter.org/models',
  },
};

export default function ModelsPage() {
  const models = getAllModels();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'LLM Model Pricing Comparison 2026',
    url: 'https://llmeter.org/models',
    description:
      'Compare LLM API pricing across 128+ models from OpenAI, Anthropic, Google AI, Mistral, DeepSeek, and OpenRouter.',
    mainEntity: {
      '@type': 'ItemList',
      name: 'LLM Model Pricing Catalog',
      numberOfItems: models.length,
      itemListElement: models.slice(0, 10).map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: m.display_name,
        description: `Input: $${m.input_price_per_1m_tokens}/1M tokens, Output: $${m.output_price_per_1m_tokens}/1M tokens`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        {/* Nav */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="text-cyan-400">LLMeter</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
              <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="/models" className="hover:text-foreground transition-colors text-foreground">Model Pricing</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/login">
                <Button size="sm" variant="ghost">Log in</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Start Free</Button>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <div className="container max-w-screen-xl py-10 md:py-16">
            {/* Back link */}
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>

            {/* Hero */}
            <div className="mb-10 max-w-2xl">
              <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                LLM Model Pricing Comparison{' '}
                <span className="text-cyan-400">2026</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Input and output token costs per 1M tokens across{' '}
                <strong className="text-foreground">{models.length} models</strong> from{' '}
                OpenAI, Anthropic, Google AI, Mistral, DeepSeek, and OpenRouter.
                Prices sourced from provider billing APIs.
              </p>
            </div>

            {/* Explanation */}
            <div className="mb-8 grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3 sm:p-6">
              <div>
                <div className="mb-1 text-sm font-semibold text-foreground">Input tokens</div>
                <div className="text-sm text-muted-foreground">
                  Cost for the text you send to the model (your prompt + context).
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-semibold text-foreground">Output tokens</div>
                <div className="text-sm text-muted-foreground">
                  Cost for text the model generates. Typically 3–5× more expensive than input.
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-semibold text-foreground">Why LLMeter?</div>
                <div className="text-sm text-muted-foreground">
                  LLMeter tracks your actual spend across all providers automatically — no manual spreadsheets.
                </div>
              </div>
            </div>

            {/* Table */}
            <ModelsTable models={models} />

            {/* CTA */}
            <div className="mt-16 rounded-xl border border-border bg-gradient-to-br from-cyan-500/5 to-violet-500/5 p-8 text-center">
              <h2 className="mb-2 text-2xl font-bold">Stop guessing — track your actual spend</h2>
              <p className="mb-6 text-muted-foreground">
                LLMeter connects to your provider APIs and shows your real costs in one dashboard.
                Free tier available. Setup takes 30 seconds.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Get started free <ArrowRight className="h-4 w-4" />
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

        {/* Footer */}
        <footer className="border-t border-border py-6">
          <div className="container max-w-screen-xl space-y-3 text-center text-sm text-muted-foreground">
            <p>
              Prices are sourced from provider billing APIs and updated regularly.{' '}
              <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
                LLMeter
              </Link>{' '}
              — open-source LLM cost monitoring.
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
