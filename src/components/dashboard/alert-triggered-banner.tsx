'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertEventSummary {
  id: number;
  message: string;
  sent_at: string;
  data: { alertType?: string };
}

const DISMISS_KEY = 'llmeter_alert_banner_dismissed_at';

function isDismissed(latestEventTime: string): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (!dismissedAt) return false;
  return new Date(dismissedAt) >= new Date(latestEventTime);
}

function dismiss(latestEventTime: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, latestEventTime);
  }
}

function computeTimeLabel(sentAt: string, now: number): string {
  const hoursAgo = Math.round(
    (now - new Date(sentAt).getTime()) / 3_600_000
  );
  return hoursAgo < 1 ? 'less than an hour ago' : `${hoursAgo}h ago`;
}

export function AlertTriggeredBanner({
  events,
}: {
  events: AlertEventSummary[];
}) {
  const [hidden, setHidden] = useState(() => {
    if (events.length === 0) return true;
    return isDismissed(events[0].sent_at);
  });

  // Capture current time once on initial render to avoid impure Date.now() in render body
  const [mountTime] = useState(() => Date.now());

  if (hidden || events.length === 0) return null;

  const count = events.length;
  const latest = events[0];
  const timeLabel = computeTimeLabel(latest.sent_at, mountTime);

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 dark:border-destructive/40 dark:bg-destructive/10"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {count === 1
              ? '1 alert triggered'
              : `${count} alerts triggered`}{' '}
            <span className="font-normal text-muted-foreground">
              — latest {timeLabel}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {latest.message}
          </p>
          <Link
            href="/alerts"
            className="mt-1 inline-block text-xs font-medium text-destructive hover:underline"
          >
            View alerts &rarr;
          </Link>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => {
          dismiss(latest.sent_at);
          setHidden(true);
        }}
        aria-label="Dismiss alert banner"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
