-- Migration: Stripe → Paddle Billing
-- Renames billing columns and event tracking table for Paddle integration.

-- 1. Rename Stripe columns on profiles to Paddle equivalents
ALTER TABLE profiles RENAME COLUMN stripe_customer_id TO paddle_customer_id;
ALTER TABLE profiles RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;

-- 2. Rename the event deduplication table
ALTER TABLE stripe_events RENAME TO paddle_events;

-- 3. Update any indexes that reference old column names
-- (PostgreSQL auto-renames indexes on column rename, but let's ensure
--  the dedup table index is usable)
-- The primary key / unique constraint on stripe_events.id carries over automatically.
