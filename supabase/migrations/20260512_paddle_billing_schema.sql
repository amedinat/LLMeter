-- Migration: Paddle Billing schema reconciliation (2026-05-12)
-- Brings the production DB in line with what the Paddle webhook + API-keys
-- routes expect. Several earlier migrations (20260326, 20260401) were never
-- applied to prod; this consolidates the billing-critical parts. Idempotent.

-- ---------------------------------------------------------------------------
-- 1. profiles: rename Stripe billing columns to Paddle + add subscription state
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='profiles' AND column_name='stripe_customer_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='profiles' AND column_name='paddle_customer_id') THEN
    ALTER TABLE profiles RENAME COLUMN stripe_customer_id TO paddle_customer_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='profiles' AND column_name='stripe_subscription_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='profiles' AND column_name='paddle_subscription_id') THEN
    ALTER TABLE profiles RENAME COLUMN stripe_subscription_id TO paddle_subscription_id;
  END IF;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paddle_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paddle_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_issue boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- 2. paddle_events: webhook idempotency table (server-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paddle_events (
  id text PRIMARY KEY,
  type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE paddle_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename='paddle_events' AND policyname='paddle_events_service_only') THEN
    CREATE POLICY paddle_events_service_only ON paddle_events
      FOR ALL TO authenticated USING (false);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. api_keys: per-user ingestion API keys (from never-applied 20260326)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz,
  is_active boolean DEFAULT true NOT NULL,
  description text
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename='api_keys' AND policyname='Users can manage their own API keys') THEN
    CREATE POLICY "Users can manage their own API keys"
      ON api_keys FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Backfill: John's founder Pro subscription (test purchase 2026-05-11)
--    subscription sub_01krcnbabkv8y0q62fwxfwdq33 / customer ctm_01krcn4c8h7nntf7348257mx5t
-- ---------------------------------------------------------------------------
UPDATE profiles
   SET plan = 'pro',
       plan_status = 'pro',
       paddle_customer_id = 'ctm_01krcn4c8h7nntf7348257mx5t',
       paddle_subscription_id = 'sub_01krcnbabkv8y0q62fwxfwdq33',
       payment_issue = false
 WHERE id = '09110b2a-ee96-4cf7-9dc8-7070cb8390a4';
