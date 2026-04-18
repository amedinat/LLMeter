"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { updateLastSeen } from "@/lib/tracking";
import { pulseTrack } from "@/lib/saas-pulse";

/**
 * Invisible component that:
 * - Updates last_seen_at on mount (retention tracking)
 * - Sends page_view events to SaaS Pulse on each route change
 *
 * Place in the authenticated dashboard layout.
 */
export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    updateLastSeen();
  }, []);

  useEffect(() => {
    pulseTrack("page_view", { metadata: { page: pathname } });
  }, [pathname]);

  return null;
}
