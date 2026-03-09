"use client";

import { useEffect } from "react";
import { updateLastSeen } from "@/lib/tracking";

/**
 * Invisible component that updates last_seen_at on mount.
 * Place in the authenticated layout to track retention.
 */
export function ActivityTracker() {
  useEffect(() => {
    updateLastSeen();
  }, []);

  return null;
}
