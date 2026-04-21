import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — LLMeter',
  description: 'LLMeter privacy policy. Learn how we handle your data and API keys.',
  openGraph: {
    title: 'Privacy Policy — LLMeter',
    description: 'LLMeter privacy policy. Learn how we handle your data and API keys.',
    url: 'https://llmeter.org/privacy',
    siteName: 'LLMeter',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy — LLMeter',
    description: 'LLMeter privacy policy. Learn how we handle your data and API keys.',
  },
};

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground"><em>Last updated: April 2026</em></p>

          <h2>1. Who We Are</h2>
          <p>LLMeter (&quot;we&quot;, &quot;us&quot;) is operated by John Medina, sole proprietor based in Colombia. We are the data controller for personal information processed via llmeter.org. For privacy matters, contact <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>

          <h2>2. Information We Collect</h2>
          <p><strong>You provide directly:</strong> email address, name, password hash; provider API keys (stored AES-256-GCM encrypted, read-only recommended); optional organization/team metadata; support communications.</p>
          <p><strong>Billing data:</strong> collected and stored by Paddle as Merchant of Record. We receive limited metadata only (plan, subscription status, country, transaction ID). Card and tax details are handled exclusively by Paddle.</p>
          <p><strong>Automatically collected:</strong> pages visited, features used, timestamps, IP address, browser/OS. Essential cookies for authentication and session management.</p>
          <p><strong>From your providers (if connected):</strong> usage metadata — model name, token counts, cost per request. We do <strong>not</strong> access prompts, completions, fine-tuned models, or any content data.</p>

          <h2>3. How We Use Your Data</h2>
          <ul>
            <li>Provide and operate the Service</li>
            <li>Process subscriptions and send transactional emails (receipts, password resets, alerts)</li>
            <li>Send budget and anomaly alerts you configure</li>
            <li>Improve features, troubleshoot, and analyze usage patterns</li>
            <li>Prevent fraud, abuse, and enforce our <Link href="/terms">Terms</Link></li>
            <li>Comply with legal and tax obligations</li>
          </ul>

          <h2>4. Legal Bases (GDPR / UK GDPR)</h2>
          <ul>
            <li><strong>Contract</strong> — processing necessary to deliver the Service you subscribed to</li>
            <li><strong>Legitimate interests</strong> — service improvement, security, fraud prevention</li>
            <li><strong>Consent</strong> — marketing communications and optional cookies (opt-in)</li>
            <li><strong>Legal obligation</strong> — tax records, responding to lawful requests</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>All API keys are encrypted at rest using AES-256-GCM with per-key nonces. Data in transit is protected with TLS 1.3. Passwords are hashed (bcrypt). We apply least-privilege access controls, regular patching, and Supabase Row-Level Security. No method of transmission is 100% secure; we cannot guarantee absolute security. In case of a confirmed breach affecting your data, we will notify you as required by applicable law.</p>

          <h2>6. Data Retention</h2>
          <ul>
            <li>Usage data: 30 days on Free, 1 year on Pro/Team (extended retention available)</li>
            <li>Account data: retained while your account is active; deleted within 30 days of account deletion (backups may retain encrypted copies up to 90 days)</li>
            <li>Billing records: retained by Paddle per their policy and as required by tax law</li>
            <li>Support communications: up to 24 months</li>
            <li>Server access logs: up to 90 days</li>
          </ul>

          <h2>7. Third Parties (Sub-processors)</h2>
          <p>We use the following providers to operate the Service. They process personal data only on our instructions and under data-protection agreements:</p>
          <ul>
            <li><strong>Vercel</strong> — application hosting, edge network</li>
            <li><strong>Supabase</strong> — database (PostgreSQL) and authentication</li>
            <li><strong>Upstash</strong> — Redis cache and rate limiting</li>
            <li><strong>Inngest</strong> — background job execution</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Plausible</strong> — privacy-friendly web analytics (no cookies, no personal data collected)</li>
            <li><strong>Paddle.com Market Ltd.</strong> — payment processing, Merchant of Record (<a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">Paddle Privacy</a>)</li>
          </ul>
          <p>We do not sell or share personal data with third parties for advertising.</p>

          <h2>8. International Transfers</h2>
          <p>Your data may be processed in countries outside your own, including the United States and the European Union, depending on where our sub-processors operate. Where required by law, transfers rely on Standard Contractual Clauses or equivalent safeguards.</p>

          <h2>9. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data (subject to legal retention obligations)</li>
            <li>Restrict or object to processing</li>
            <li>Data portability — receive your data in a machine-readable format</li>
            <li>Withdraw consent at any time (without affecting prior lawful processing)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p>Residents in the EEA/UK benefit from the GDPR / UK GDPR. California residents benefit from the CCPA/CPRA. Brazilian residents from the LGPD. Colombian residents from Ley 1581 de 2012 and Decreto 1377 de 2013. To exercise any right, email <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>; we respond within 30 days.</p>
          <p>You can also export or delete your data at any time from your account settings without contacting us.</p>

          <h2>10. Cookies and Analytics</h2>
          <p>We use essential cookies for authentication and session management. For analytics we use <a href="https://plausible.io/privacy-focused-web-analytics" target="_blank" rel="noopener noreferrer">Plausible</a>, a cookie-less, privacy-friendly analytics service that does not collect personal data or use cross-site tracking. You can clear or block cookies in your browser settings.</p>

          <h2>11. Children</h2>
          <p>The Service is not directed to children under 16. We do not knowingly collect data from children. If you believe a child has provided us data, contact <a href="mailto:hello@llmeter.org">hello@llmeter.org</a> and we will delete it.</p>

          <h2>12. Third-Party Links</h2>
          <p>The Service may link to third-party sites (including your connected AI providers). We are not responsible for their privacy practices; review their policies before providing data.</p>

          <h2>13. Changes to This Policy</h2>
          <p>We may update this Policy from time to time. Material changes will be communicated by email or a prominent in-app notification. The &quot;Last updated&quot; date reflects the latest revision.</p>

          <h2>14. Contact</h2>
          <p>For privacy questions, data requests, or complaints, email <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>
        </article>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LLMeter. <Link href="/terms" className="underline underline-offset-4">Terms</Link> &middot; <Link href="/refund" className="underline underline-offset-4">Refund</Link> &middot; <Link href="/" className="underline underline-offset-4">Home</Link>
        </div>
      </footer>
    </div>
  );
}
