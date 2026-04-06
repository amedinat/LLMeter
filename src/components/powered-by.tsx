import { Zap } from 'lucide-react';

export function PoweredByLLMeter() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-muted-foreground/60 select-none print:text-muted-foreground">
      <Zap className="h-3 w-3" />
      <span>
        Powered by{' '}
        <a
          href="https://llmeter.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-muted-foreground/80 hover:text-primary transition-colors"
        >
          LLMeter
        </a>
      </span>
    </div>
  );
}
