import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — LLMeter',
  description: 'LLMeter privacy policy. Learn how we handle your data and API keys.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="font-bold">LLMeter</Link>
        </div>
      </header>
      <main className="container flex-1 py-12">
        <article className="prose prose-neutral dark:prose-invert mx-auto max-w-[42rem]">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground"><em>Last updated: March 2026</em></p>

          <h2>1. Information We Collect</h2>
          <p>When you create an account, we collect your email address and basic profile information. When you connect an API provider, we store your read-only API key in encrypted form (AES-256-GCM) to fetch your usage data.</p>

          <h2>2. How We Use Your Data</h2>
          <p>We use your API keys solely to retrieve usage and billing data from your providers (OpenAI, Anthropic, DeepSeek, OpenRouter). We never access your prompts, completions, fine-tuned models, or any content data.</p>

          <h2>3. Data Security</h2>
          <p>All API keys are encrypted at rest using AES-256-GCM. Data in transit is protected with TLS 1.3. We follow industry-standard security practices and regularly review our security posture.</p>

          <h2>4. Data Retention</h2>
          <p>Usage data is retained for the duration specified by your plan (30 days for Free, 1 year for Pro/Team). When you delete your account, all data including encrypted keys is permanently removed within 30 days.</p>

          <h2>5. Third Parties</h2>
          <p>We use Supabase for database hosting and authentication, Paddle for payment processing, and Vercel for application hosting. We do not sell or share your personal data with any other third parties.</p>

          <h2>6. Your Rights</h2>
          <p>You can export or delete your data at any time from your account settings. For questions, contact us at <a href="mailto:hello@llmeter.org">hello@llmeter.org</a>.</p>

          <h2>7. Changes</h2>
          <p>We may update this policy from time to time. We will notify you of material changes via email or in-app notification.</p>
        </article>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LLMeter. <Link href="/terms" className="underline underline-offset-4">Terms</Link> &middot; <Link href="/" className="underline underline-offset-4">Home</Link>
        </div>
      </footer>
    </div>
  );
}
