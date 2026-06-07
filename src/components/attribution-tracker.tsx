'use client';

import { useEffect } from 'react';

/**
 * First-touch attribution. On the visitor's first page, captures UTM params,
 * external referrer host and landing path into a first-party cookie (`llm_attr`).
 * Never overwrites an existing cookie (first-touch wins) and never throws —
 * analytics must never break the page. The cookie is read server-side in
 * `auth/callback` and persisted onto the user's metadata at signup, so John can
 * see which source/landing actually converts (ICP signal for the revenue gate).
 */
const COOKIE = 'llm_attr';
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export function AttributionTracker() {
  useEffect(() => {
    try {
      if (document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`))) return;

      const params = new URLSearchParams(window.location.search);
      const attr: Record<string, string> = {};
      for (const k of UTM_KEYS) {
        const v = params.get(k);
        if (v) attr[k] = v.slice(0, 120);
      }
      try {
        if (document.referrer) {
          const host = new URL(document.referrer).hostname;
          if (host && host !== window.location.hostname) attr.ref = host.slice(0, 120);
        }
      } catch {
        /* malformed referrer — ignore */
      }
      attr.landing = window.location.pathname.slice(0, 120);
      attr.ts = new Date().toISOString().slice(0, 10);

      document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(attr))}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    } catch {
      /* analytics must never break the page */
    }
  }, []);

  return null;
}
