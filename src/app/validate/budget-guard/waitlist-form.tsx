'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SOURCE = 'validate-budget-guard';

export function WaitlistForm({ ctaLabel = 'Get Early Access' }: { ctaLabel?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          source: SOURCE,
          metadata: { referrer: typeof document !== 'undefined' ? document.referrer || null : null },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Could not save signup');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-6 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <h3 className="text-xl font-semibold">You&apos;re on the list.</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          We&apos;ll email <span className="font-medium text-foreground">{email}</span> the moment Budget Guard ships. Watch for a note from{' '}
          <span className="font-mono text-xs">hello@llmeter.org</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@yourcompany.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'submitting'}
          className="h-12 flex-1 text-base"
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === 'submitting' || !email}
          className="h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90 text-white sm:w-auto"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…
            </>
          ) : (
            <>
              {ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      {status === 'error' && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}. Please try again or email hello@llmeter.org.</p>
      )}
      <p className="text-xs text-muted-foreground/70">
        No spam. One email when Budget Guard goes live. Unsubscribe anytime.
      </p>
    </form>
  );
}
