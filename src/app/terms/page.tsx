import Link from 'next/link';
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="font-bold">LLMeter</Link>
        </div>
      </header>
      <main className="container flex-1 py-12">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[42rem]">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground"><em>Last updated: March 2026</em></p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using LLMeter (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2>2. Description of Service</h2>
          <p>LLMeter is a cost monitoring dashboard for AI API usage. We retrieve billing and usage data from your connected providers using read-only API keys. We do not proxy, intercept, or modify your API traffic.</p>

          <h2>3. Your Account</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating your account.</p>

          <h2>4. API Keys</h2>
          <p>You grant us permission to use your provided API keys solely to fetch usage and billing data. We recommend using read-only keys when available. You may revoke access at any time by removing the key from your account or revoking it at the provider.</p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to misuse the Service, including attempting to access other users&apos; data, reverse-engineering the platform, or using automated tools to scrape data.</p>

          <h2>6. Billing and Cancellation</h2>
          <p>Paid plans are billed monthly via Paddle. You may cancel at any time. Upon cancellation, your account reverts to the Free plan and you retain access to your data within Free plan limits.</p>

          <h2>7. Limitation of Liability</h2>
          <p>LLMeter is provided &quot;as is&quot; without warranty. We are not liable for any inaccuracies in reported usage data, provider API changes, or indirect damages resulting from use of the Service.</p>

          <h2>8. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the Service constitutes acceptance of updated terms.</p>

          <h2>9. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>
        </article>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LLMeter. <Link href="/privacy" className="underline underline-offset-4">Privacy</Link> &middot; <Link href="/" className="underline underline-offset-4">Home</Link>
        </div>
      </footer>
    </div>
  );
}
