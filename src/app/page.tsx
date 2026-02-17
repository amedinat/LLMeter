import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <span className="text-lg font-bold">LLMeter</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Start Free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          See exactly how much you spend on AI APIs
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Connect your API keys in 2 minutes. Monitor costs across OpenAI,
          Anthropic, and more. Get recommendations to save up to 80%.
        </p>
        <Button size="lg" asChild>
          <Link href="/login">Start Free — No credit card required</Link>
        </Button>

        {/* Features */}
        <div className="mt-12 grid max-w-3xl gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Multi-Provider Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              All your AI costs in one place. OpenAI + Anthropic + more.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Optimization Tips</h3>
            <p className="text-sm text-muted-foreground">
              Automatic recommendations to reduce costs without changing code.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Budget Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Get notified before you overspend. Set daily or monthly limits.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex h-14 items-center justify-center border-t text-sm text-muted-foreground">
        LLMeter
      </footer>
    </div>
  );
}
