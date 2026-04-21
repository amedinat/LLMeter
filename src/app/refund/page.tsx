import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — LLMeter',
  description: 'LLMeter refund policy. 14-day money-back guarantee on new subscriptions, processed via Paddle.',
  openGraph: {
    title: 'Refund Policy — LLMeter',
    description: 'LLMeter refund policy. 14-day money-back guarantee on new subscriptions, processed via Paddle.',
    url: 'https://llmeter.org/refund',
    siteName: 'LLMeter',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Refund Policy — LLMeter',
    description: '14-day money-back guarantee on new LLMeter subscriptions.',
  },
};

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="font-bold">LLMeter</Link>
        </div>
      </header>
      <main className="container flex-1 py-12">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[42rem]">
          <h1>Refund Policy</h1>
          <p className="text-muted-foreground"><em>Last updated: April 2026</em></p>

          <h2>Summary</h2>
          <p>We offer a <strong>14-day money-back guarantee</strong> on new LLMeter paid subscriptions. If you are not satisfied within 14 days of your initial charge, you can request a full refund — no questions asked.</p>

          <h2>1. Who Processes Refunds</h2>
          <p>Paddle.com Market Ltd. is the Merchant of Record for all LLMeter purchases and processes all refunds on our behalf. Refunds are issued back to the original payment method used for the purchase.</p>

          <h2>2. Eligibility</h2>
          <p><strong>Eligible for refund:</strong></p>
          <ul>
            <li>First-time subscription to any LLMeter paid plan, within 14 calendar days of the initial charge</li>
            <li>Duplicate or accidental charges (refunded regardless of the 14-day window)</li>
            <li>Service outages or failures attributable to LLMeter that materially prevented you from using the paid features</li>
          </ul>
          <p><strong>Not eligible:</strong></p>
          <ul>
            <li>Renewal charges after the first billing cycle (you may cancel at any time to prevent the next renewal; see section 4)</li>
            <li>Refund requests submitted more than 14 days after the initial charge</li>
            <li>Accounts suspended or terminated for violation of our <Link href="/terms">Terms of Service</Link></li>
          </ul>

          <h2>3. How to Request a Refund</h2>
          <p>Email <a href="mailto:hello@llmeter.org">hello@llmeter.org</a> with:</p>
          <ol>
            <li>The email address used on your LLMeter account</li>
            <li>The transaction ID (found on your Paddle receipt)</li>
            <li>A brief reason (optional, helps us improve)</li>
          </ol>
          <p>We acknowledge requests within 2 business days and forward them to Paddle. Refunds typically appear on your statement within 5–10 business days, depending on your bank or card issuer.</p>
          <p>Alternatively, you can contact Paddle directly using the &quot;Contact support&quot; link on your receipt email — this usually resolves fastest.</p>

          <h2>4. Cancellation (No Refund Needed)</h2>
          <p>You can cancel your subscription at any time from your account settings. Cancellation stops future renewal charges; you retain access to paid features until the end of your current billing period. No action on our side is required — it is self-serve.</p>

          <h2>5. Annual Plans</h2>
          <p>For annual plans, the 14-day money-back guarantee applies the same way. After the 14-day window, annual plans are non-refundable for the remainder of the term, but you can cancel to prevent the next annual renewal.</p>

          <h2>6. Chargebacks</h2>
          <p>If you have a concern about a charge, please contact us first at <a href="mailto:hello@llmeter.org">hello@llmeter.org</a> — we almost always resolve these within 48 hours. Filing a chargeback with your bank without contacting us first may result in account suspension while the dispute is investigated.</p>

          <h2>7. Consumer Rights</h2>
          <p>This Refund Policy is offered in addition to, and does not limit, any consumer rights granted by applicable local law (for example, the EU/UK 14-day right of withdrawal for digital services, or Ley 1480 de 2011 in Colombia).</p>

          <h2>8. Contact</h2>
          <p>Refund questions: <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>
        </article>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LLMeter. <Link href="/terms" className="underline underline-offset-4">Terms</Link> &middot; <Link href="/privacy" className="underline underline-offset-4">Privacy</Link> &middot; <Link href="/" className="underline underline-offset-4">Home</Link>
        </div>
      </footer>
    </div>
  );
}
