import { createClient } from "@/lib/supabase/client";
import { pulseTrack } from "@/lib/saas-pulse";

/**
 * Trackable events in LLMeter.
 * Add new events here as the product grows.
 */
export type TrackableEvent =
  | "dashboard_viewed"
  | "provider_added"
  | "provider_removed"
  | "alert_created"
  | "alert_deleted"
  | "settings_viewed"
  | "billing_portal_opened"
  | "plan_changed"
  | "usage_refreshed";

/**
 * Track a user event in the user_events table.
 * Also forwards to SaaS Pulse for centralized metrics.
 * Fire-and-forget: errors are silently logged to console.
 */
export async function trackEvent(
  event: TrackableEvent,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_events").insert({
      user_id: user.id,
      event,
      metadata: metadata ?? {},
    });

    // Forward to SaaS Pulse (fire-and-forget)
    pulseTrack(event, { user_ref: user.id, metadata });
  } catch (err) {
    console.error("[tracking] Failed to track event:", event, err);
  }
}

/**
 * Update the user's last_seen_at timestamp.
 * Throttled: only updates if last update was >5 minutes ago.
 * Uses sessionStorage to avoid redundant DB calls.
 */
const THROTTLE_KEY = "llmeter_last_seen_update";
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function updateLastSeen() {
  try {
    // Throttle via sessionStorage
    if (typeof window !== "undefined") {
      const lastUpdate = sessionStorage.getItem(THROTTLE_KEY);
      if (lastUpdate && Date.now() - Number(lastUpdate) < THROTTLE_MS) {
        return;
      }
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(THROTTLE_KEY, String(Date.now()));
    }
  } catch (err) {
    console.error("[tracking] Failed to update last_seen_at:", err);
  }
}
