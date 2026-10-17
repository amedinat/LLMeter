-- WS1: per-customer monthly revenue for unit-economics / margin.
-- Applied manually in Supabase (prod migrations are not auto-applied).
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_revenue_usd numeric(12,2);
