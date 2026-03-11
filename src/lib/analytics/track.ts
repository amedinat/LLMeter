import { createClient } from '@/lib/supabase/server';
import type { EventName } from './events';

/**
 * Track a user event (server-side, fire-and-forget).
 * Uses the authenticated user's session client (respects RLS).
 */
export function trackEvent(
  userId: string,
  eventName: EventName,
  metadata?: Record<string, unknown>
): void {
  try {
    createClient().then((supabase) =>
      supabase
        .from('user_events')
        .insert({
          user_id: userId,
          event_name: eventName,
          metadata: metadata ?? {},
        })
        .then(({ error }) => {
          if (error) {
            console.error(`[analytics] Failed to track ${eventName}:`, error.message);
          }
        })
    );
  } catch (err) {
    console.error('[analytics] trackEvent error:', err);
  }
}

/**
 * Update last_seen_at for a user (server-side, fire-and-forget).
 * Uses the authenticated user's session client (respects RLS).
 */
export function updateLastSeen(userId: string): void {
  try {
    createClient().then((supabase) =>
      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('[analytics] Failed to update last_seen_at:', error.message);
          }
        })
    );
  } catch (err) {
    console.error('[analytics] updateLastSeen error:', err);
  }
}
