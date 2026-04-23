import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — LLMeter',
  description: 'LLMeter terms of service. Read our terms and conditions for using LLMeter.',
  openGraph: {
    title: 'Terms of Service — LLMeter',
    description: 'LLMeter terms of service. Read our terms and conditions for using LLMeter.',
    url: 'https://llmeter.org/terms',
    siteName: 'LLMeter',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service — LLMeter',
    description: 'LLMeter terms of service. Read our terms and conditions for using LLMeter.',
  },
};

export default function TermsPage() {
  return (
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
              <Link href="/models" className="transition-colors hover:text-foreground/80 text-foreground/60">Model Pricing</Link>
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
      <main className="container flex-1 py-12">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[42rem]">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground"><em>Last updated: April 2026</em></p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using LLMeter (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. The Service is operated by John Medina (&quot;we&quot;, &quot;us&quot;), a sole proprietor based in Colombia.</p>

          <h2>2. Merchant of Record</h2>
          <p>Paddle.com Market Ltd. (&quot;Paddle&quot;) is the Merchant of Record for all purchases on LLMeter. Paddle processes payments, issues invoices, handles tax collection in applicable jurisdictions, and manages refunds and chargebacks. By purchasing a paid plan, you also agree to <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Paddle&apos;s Buyer Terms</a>. Charges on your payment method will appear as &quot;PADDLE.NET* LLMETER&quot; or similar.</p>

          <h2>3. Description of Service</h2>
          <p>LLMeter is a cost monitoring dashboard for AI API usage. We retrieve billing and usage data from your connected providers using read-only API keys. We do not proxy, intercept, or modify your API traffic. The Service is offered as:</p>
          <ul>
            <li><strong>Open-source Core</strong> (self-hostable, <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPL-3.0</a>): <a href="https://github.com/amedinat/LLMeter" target="_blank" rel="noopener noreferrer">github.com/amedinat/LLMeter</a></li>
            <li><strong>Cloud (SaaS)</strong> on llmeter.org with paid tiers (Pro, Team) for multi-provider support, extended retention, and commercial features</li>
          </ul>

          <h2>4. Your Account</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information when creating your account and notify us immediately of any unauthorized access.</p>

          <h2>5. API Keys</h2>
          <p>You grant us permission to use the API keys you provide solely to fetch usage and billing data from your configured providers. We recommend using read-only or scoped keys when available. You may revoke access at any time by removing the key from your account or revoking it at the provider.</p>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to: misuse the Service, attempt to access other users&apos; data, reverse-engineer the commercial SaaS components, use automated tools to scrape data beyond documented APIs, or use the Service for unlawful purposes. Violations may result in suspension or termination.</p>

          <h2>7. Subscriptions, Billing and Cancellation</h2>
          <p>Paid plans are billed on a recurring basis (monthly or annually) via Paddle in advance. You may cancel at any time from your account settings; cancellation takes effect at the end of the current billing period and no further charges will be made. Upon cancellation your account reverts to the Free plan and you retain access to your data within Free plan limits.</p>

          <h2>8. Refunds</h2>
          <p>Refunds are governed by our <Link href="/refund">Refund Policy</Link>.</p>

          <h2>9. Intellectual Property and Open Source</h2>
          <p>The open-source Core of LLMeter is licensed under <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">GNU Affero General Public License v3.0</a> and its use is governed by that license. The commercial SaaS components, including Cloud-only features and our service infrastructure, are proprietary. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to use the commercial components during your active subscription. All trademarks (including &quot;LLMeter&quot; and &quot;Simplifai&quot;) remain our property.</p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. We do not warrant that cost calculations or usage metrics match exactly the billing of third-party providers (provider APIs change, delay, or return approximated data). Use LLMeter figures as a reference, not as an official invoice reconciliation.</p>

          <h2>11. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE EVENT.</p>

          <h2>12. Termination</h2>
          <p>We may suspend or terminate your access for breach of these Terms, non-payment, or as required by law. Upon termination, your right to use the Service ceases. Sections that by nature should survive (intellectual property, disclaimers, limitation of liability, governing law) remain in effect.</p>

          <h2>13. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be communicated by email or a prominent notice on llmeter.org. Continued use of the Service after changes constitutes acceptance.</p>

          <h2>14. Governing Law</h2>
          <p>These Terms are governed by the laws of Colombia, without regard to conflict-of-law principles. Disputes shall be resolved in the courts of Bogotá, Colombia. Nothing in this section limits mandatory consumer rights granted by applicable local law.</p>

          <h2>15. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>
        </article>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LLMeter. <Link href="/privacy" className="underline underline-offset-4">Privacy</Link> &middot; <Link href="/refund" className="underline underline-offset-4">Refund</Link> &middot; <Link href="/" className="underline underline-offset-4">Home</Link> &middot; <a href="https://simplifai.tools" target="_blank" rel="noreferrer" className="underline underline-offset-4">A Simplifai product</a>
        </div>
      </footer>
    </div>
  );
}
