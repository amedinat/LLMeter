'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface NotificationEvent {
  id: number;
  alert_id: string;
  message: string;
  data: Record<string, unknown>;
  sent_at: string;
}

const LAST_SEEN_KEY = 'llmeter_notifications_last_seen';

function getLastSeen(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SEEN_KEY);
}

function setLastSeen(timestamp: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_SEEN_KEY, timestamp);
  }
}

export function NotificationBell() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const { events: fetched } = await res.json();
      setEvents(fetched);

      const lastSeen = getLastSeen();
      if (lastSeen) {
        const count = fetched.filter(
          (e: NotificationEvent) => new Date(e.sent_at) > new Date(lastSeen)
        ).length;
        setUnreadCount(count);
      } else {
        setUnreadCount(fetched.length);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  function handleOpen(open: boolean) {
    if (open && events.length > 0) {
      setLastSeen(events[0].sent_at);
      setUnreadCount(0);
    }
  }

  function getAlertIcon(data: Record<string, unknown>) {
    const type = data.alertType as string;
    if (type === 'anomaly') return '📈';
    if (type === 'monthly') return '💰';
    return '⚠️';
  }

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {events.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No alerts triggered yet
          </div>
        ) : (
          events.slice(0, 10).map((event) => (
            <DropdownMenuItem
              key={event.id}
              className="flex flex-col items-start gap-1 py-2 cursor-pointer"
              onClick={() => router.push('/alerts')}
            >
              <div className="flex items-start gap-2 w-full">
                <span className="text-base leading-none mt-0.5">
                  {getAlertIcon(event.data)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug line-clamp-2">
                    {event.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(event.sent_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {events.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-xs text-muted-foreground"
              onClick={() => router.push('/alerts')}
            >
              View all alerts
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
