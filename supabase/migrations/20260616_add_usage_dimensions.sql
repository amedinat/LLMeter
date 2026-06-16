-- WS2: multi-dimensional attribution (feature + environment) on customer usage records.
-- Applied manually in Supabase (prod migrations are not auto-applied).
ALTER TABLE customer_usage_records ADD COLUMN IF NOT EXISTS feature text;
ALTER TABLE customer_usage_records ADD COLUMN IF NOT EXISTS environment text;
