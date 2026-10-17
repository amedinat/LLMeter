import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Check, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MobileNav } from '@/components/mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ExtensionCheckout } from './extension-checkout';

const PAGE_URL = 'https://www.llmeter.org/extension';
const TITLE = 'LLMeter Live Cost — Anthropic & OpenAI spend tracker extension';
const DESCRIPTION =
  'Free Chrome & Edge extension that shows your Anthropic and OpenAI API spend from the toolbar: month to date, run-rate, projection and budget alerts. Admin keys never leave your device.';
const PRO_PRICE = '$29';

/** Chrome Web Store URL once the listing is live; placeholder until then. */
const STORE_URL = process.env.NEXT_PUBLIC_EXT_STORE_URL;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: PAGE_URL },
  keywords: [
    'anthropic api cost extension',
    'openai api spend tracker',
    'claude api cost chrome extension',
    'openai usage chrome extension',
    'llm api budget alert',
    'anthropic admin api cost report',
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
};

const FAQ = [
  {
    q: 'Do my API keys or costs go through LLMeter servers?',
    a: 'No. Keys are stored in chrome.storage.local and sent only to api.anthropic.com or api.openai.com. The extension has no content scripts and no analytics. The only thing it ever sends to llmeter.org is a Pro license key plus a random device id, if you buy one.',
  },
  {
    q: 'Which key do I need?',
    a: 'An organization admin key, not a regular project key: Anthropic → Settings → Admin keys (starts with sk-ant-admin), OpenAI → Settings → Organization → Admin keys (starts with sk-admin). Both providers only expose cost reports to admin credentials; a normal key gets a 401/403 and the popup tells you so.',
  },
  {
    q: 'What does Pro add, and is it really one-time?',
    a: `Yes — ${PRO_PRICE} once, no subscription. Pro unlocks both providers at the same time, 90 days of history, the end-of-month projection with a red budget badge, and CSV export. Free keeps working forever with one provider and 30 days.`,
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes, within 14 days of purchase, no questions asked. Payments are handled by Paddle; see our refund policy.',
  },
  {
    q: 'Is it affiliated with Anthropic or OpenAI?',
    a: 'No. LLMeter Live Cost is an independent tool that reads the official cost APIs with your own credentials. Anthropic, Claude and OpenAI are trademarks of their respective owners.',
  },
];

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LLMeter Live Cost',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Chrome, Edge',
  url: PAGE_URL,
  description: DESCRIPTION,
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', url: PAGE_URL },
    { '@type': 'Offer', name: 'Pro (lifetime)', price: '29', priceCurrency: 'USD', url: PAGE_URL },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
    { '@type': 'ListItem', position: 2, name: 'Live Cost extension', item: PAGE_URL },
  ],
};

const FREE_FEATURES: Array<[string, boolean]> = [
  ['1 provider (Anthropic or OpenAI)', true],
  ['Month to date, last 7 days, daily run-rate', true],
  ['30 days of history', true],
  ['Auto-refresh every 6 h, spend badge on the icon', true],
  ['End-of-month projection & budget alert', false],
  ['CSV export', false],
];

const PRO_FEATURES: Array<[string, boolean]> = [
  ['Anthropic + OpenAI side by side', true],
  ['90 days of history', true],
  ['End-of-month projection', true],
  ['Red badge when projection exceeds your budget', true],
  ['CSV export of daily spend', true],
  ['Up to 5 browsers, lifetime updates', true],
];

export default async function ExtensionPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const purchased = checkout === 'success';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">LLMeter</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/models" className="text-foreground/60 transition-colors hover:text-foreground/80">Model Pricing</Link>
              <Link href="/pricing" className="text-foreground/60 transition-colors hover:text-foreground/80">Pricing</Link>
              <Link href="/extension" className="text-foreground transition-colors hover:text-foreground/80">Extension</Link>
              <Link href="/blog" className="text-foreground/60 transition-colors hover:text-foreground/80">Blog</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {purchased && (
          <div className="border-b bg-primary/10">
            <div className="container py-3 text-sm">
              Thanks for your purchase. Your license key is on its way to the email you used at checkout —
              paste it in the extension under <strong>Settings → License</strong>. Didn&rsquo;t get it in 10 minutes?{' '}
              <a href="mailto:support@llmeter.org" className="underline underline-offset-4">support@llmeter.org</a>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="container flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <Badge variant="secondary">Chrome &amp; Edge extension · Manifest V3</Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-bold tracking-tight md:text-6xl">
            Your AI API spend, live in your browser.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Keys never leave your device. LLMeter Live Cost reads the official Anthropic and OpenAI cost
            APIs with your own admin key and shows month-to-date spend, run-rate and a budget badge one click away.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {STORE_URL ? (
              <Button size="lg" asChild>
                <a href={STORE_URL} target="_blank" rel="noreferrer">
                  Install free <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button id="coming-soon" size="lg" disabled title="Coming soon to the Chrome Web Store">
                Install free — coming soon
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <a href="#pro">Get Pro — {PRO_PRICE} one-time</a>
            </Button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> No account. No proxy. No data sent to LLMeter. Open source.
          </p>
        </section>

        {/* What it does */}
        <section className="border-t bg-muted/30 py-16">
          <div className="container grid gap-8 md:grid-cols-3">
            {[
              ['Paste an admin key', 'Anthropic (sk-ant-admin…) or OpenAI (sk-admin…). Stored in chrome.storage.local, sent only to that provider.'],
              ['See the numbers', 'Month to date, last 7 days, daily run-rate and — with Pro — the projected end-of-month total.'],
              ['Catch overruns early', 'Refreshes every 6 hours in the background; the toolbar badge turns red when the projection beats your budget.'],
            ].map(([title, body], i) => (
              <div key={title} className="space-y-2">
                <div className="text-sm font-semibold text-primary">0{i + 1}</div>
                <h2 className="font-heading text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="pro" className="container py-16 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">Free forever. Pro once.</h2>
            <p className="mt-3 text-muted-foreground">
              No subscription for the extension — pay {PRO_PRICE} one time and keep every future update.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Works with no backend at all</CardDescription>
                <div className="pt-2 text-4xl font-bold">$0</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {FREE_FEATURES.map(([label, on]) => (
                    <li key={label} className="flex items-start gap-2">
                      {on ? <Check className="mt-0.5 h-4 w-4 text-primary" /> : <X className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                      <span className={on ? '' : 'text-muted-foreground'}>{label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {STORE_URL ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={STORE_URL} target="_blank" rel="noreferrer">Install free</a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Install free — coming soon
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className="border-primary shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Lifetime</Badge>
                </div>
                <CardDescription>One payment, yours forever</CardDescription>
                <div className="pt-2 text-4xl font-bold">
                  {PRO_PRICE} <span className="text-base font-normal text-muted-foreground">one-time</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {PRO_FEATURES.map(([label]) => (
                    <li key={label} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <ExtensionCheckout price={PRO_PRICE} />
              </CardFooter>
            </Card>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Secure checkout by Paddle · 14-day money-back guarantee ·{' '}
            <Link href="/refund" className="underline underline-offset-4">Refund policy</Link>
          </p>
        </section>

        {/* FAQ */}
        <section className="border-t py-16">
          <div className="container max-w-3xl">
            <h2 className="mb-8 font-heading text-3xl font-bold tracking-tight">FAQ</h2>
            <dl className="space-y-8">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                    {f.a}
                    {f.q.startsWith('Can I get a refund') && (
                      <>
                        {' '}
                        <Link href="/refund" className="text-primary underline-offset-4 hover:underline">Read the refund policy</Link>.
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-10 text-sm text-muted-foreground">
              Privacy policy for the extension:{' '}
              <a
                href="https://github.com/amedinat/LLMeter/blob/main/packages/extension/PRIVACY.md"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                PRIVACY.md
              </a>
              . Want per-model, per-customer breakdowns and alerts across six providers? That&rsquo;s the{' '}
              <Link href="/pricing" className="text-primary underline-offset-4 hover:underline">LLMeter dashboard</Link>.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:px-8 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{' '}
            <a href="https://github.com/amedinat/LLMeter" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
              LLMeter Team
            </a>
            . Source on{' '}
            <a href="https://github.com/amedinat/LLMeter/tree/main/packages/extension" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
              GitHub
            </a>
            . Not affiliated with Anthropic or OpenAI.
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/refund" className="hover:text-foreground">Refunds</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
