-- Enable RLS on core tables that were created via Supabase Studio
-- but lacked RLS policies in version-controlled migrations.
-- Uses IF NOT EXISTS to be safe if policies were already set via UI.

-- ============================================================
-- profiles: user billing/plan data
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_own_data') THEN
    CREATE POLICY profiles_own_data ON profiles FOR ALL USING (id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- providers: encrypted API keys for LLM providers
-- ============================================================
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'providers' AND policyname = 'providers_own_data') THEN
    CREATE POLICY providers_own_data ON providers FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- usage_records: LLM API usage/cost data per provider
-- ============================================================
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_records' AND policyname = 'usage_records_own_data') THEN
    CREATE POLICY usage_records_own_data ON usage_records FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- alerts: user-configured budget/anomaly alerts
-- ============================================================
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alerts' AND policyname = 'alerts_own_data') THEN
    CREATE POLICY alerts_own_data ON alerts FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- alert_events: triggered alert history
-- ============================================================
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_events' AND policyname = 'alert_events_own_data') THEN
    CREATE POLICY alert_events_own_data ON alert_events
      FOR ALL USING (
        alert_id IN (SELECT id FROM alerts WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ============================================================
-- paddle_events: webhook idempotency (server-only, block client access)
-- ============================================================
ALTER TABLE paddle_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paddle_events' AND policyname = 'paddle_events_service_only') THEN
    CREATE POLICY paddle_events_service_only ON paddle_events
      FOR ALL TO authenticated USING (false);
  END IF;
END $$;
