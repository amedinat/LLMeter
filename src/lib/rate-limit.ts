/**
 * Distributed rate limiter using Upstash Redis.
 *
 * Uses a fixed-window counter stored in Redis so rate limit state is shared
 * across all Vercel serverless instances. Falls back to an in-memory store
 * when UPSTASH_REDIS_REST_URL is not configured (local development).
 *
 * @module lib/rate-limit
 */

import { Redis } from '@upstash/redis';

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

// ---------------------------------------------------------------------------
// Redis client (lazy singleton)
// ---------------------------------------------------------------------------
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  }
  return null;
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev only)
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupMemory() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) {
      memoryStore.delete(key);
    }
  }
}

function checkMemory(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupMemory();
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + options.windowMs };
    memoryStore.set(key, newEntry);
    return { success: true, remaining: options.limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
}

// ---------------------------------------------------------------------------
// Redis-backed rate limiter (fixed window)
// ---------------------------------------------------------------------------
async function checkRedis(
  client: Redis,
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(options.windowMs / 1000);
  const redisKey = `rl:${key}`;

  // INCR + conditional EXPIRE in a pipeline for atomicity
  const pipeline = client.pipeline();
  pipeline.incr(redisKey);
  pipeline.pttl(redisKey);
  const results = await pipeline.exec<[number, number]>();

  const count = results[0] as number;
  const ttl = results[1] as number;

  // First request in window — set expiry
  if (ttl === -1) {
    await client.expire(redisKey, windowSeconds);
  }

  const resetAt = Date.now() + (ttl > 0 ? ttl : options.windowMs);
  const remaining = Math.max(0, options.limit - count);

  return {
    success: count <= options.limit,
    remaining,
    resetAt,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check rate limit for a given key.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (client) {
    try {
      return await checkRedis(client, key, options);
    } catch {
      // Redis unavailable — degrade to in-memory rather than blocking requests
      return checkMemory(key, options);
    }
  }
  return checkMemory(key, options);
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
