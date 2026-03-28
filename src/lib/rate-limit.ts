/**
 * Simple in-memory rate limiter for serverless environments.
 *
 * LIMITATION: This rate limiter uses an in-memory Map, so rate limit state is
 * NOT shared across Vercel serverless function instances. Each cold-start gets
 * its own empty store, meaning a determined attacker can bypass limits by
 * hitting different instances. This is acceptable for basic abuse prevention
 * but should not be relied upon for strict security enforcement.
 *
 * TODO: Replace with Vercel KV or Upstash Redis for distributed rate limiting
 * that works reliably across all serverless instances.
 *
 * @module lib/rate-limit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitOptions {
  /** Maximum number of requests in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 * Returns whether the request should be allowed.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    store.set(key, newEntry);
    return { success: true, remaining: options.limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}

/** Rate limit config for magic link requests: 5 requests per 15 minutes */
export const MAGIC_LINK_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
} satisfies RateLimitOptions;

/** Rate limit config for ingestion API: 100 requests per minute per API key */
export const INGEST_API_LIMIT = {
  limit: 100,
  windowMs: 60 * 1000,
} satisfies RateLimitOptions;
