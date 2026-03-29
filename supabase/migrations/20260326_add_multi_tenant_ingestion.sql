-- Phase MT-D: Multi-Tenant Ingestion API

-- 1. Create a table for customer-specific API keys
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

CREATE POLICY "Users can manage their own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

-- 2. Create a table for customer-specific usage records
CREATE TABLE IF NOT EXISTS customer_usage_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  model text NOT NULL,
  provider text, -- Denormalized for easier querying, derived from model pricing
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  cost_usd numeric(12, 6) NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE customer_usage_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_customer_usage_user_customer ON customer_usage_records(user_id, customer_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_usage_api_key ON customer_usage_records(api_key_id, timestamp);

CREATE POLICY "Users can insert their own customer usage records"
  ON customer_usage_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own customer usage records"
  ON customer_usage_records FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Add a table to store customer metadata
CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL,
  display_name text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, customer_id)
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

CREATE POLICY "Users can manage their own customers"
  ON customers FOR ALL
  USING (auth.uid() = user_id);

