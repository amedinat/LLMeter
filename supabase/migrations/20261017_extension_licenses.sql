-- Migration: LLMeter Live Cost (browser extension) lifetime licenses (2026-10-17)
-- Issued by the Paddle webhook on `transaction.completed` for the price in
-- NEXT_PUBLIC_PADDLE_EXT_LTD_PRICE_ID; validated by
-- POST /api/extension/license/validate. Server-only tables (service role).
-- Idempotent.

CREATE TABLE IF NOT EXISTS extension_licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- sha256(normalised key); the plaintext is never used for lookups.
  key_hash text NOT NULL UNIQUE,
  key_last4 text NOT NULL,
  -- AES-256-GCM payload from src/lib/crypto.ts so support can re-send a key.
  key_encrypted jsonb,
  email text,
  product text NOT NULL DEFAULT 'live-cost-ltd',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  max_devices integer NOT NULL DEFAULT 5,
  paddle_transaction_id text UNIQUE,
  paddle_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_validated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_extension_licenses_email ON extension_licenses(lower(email));

CREATE TABLE IF NOT EXISTS extension_license_devices (
  license_id uuid NOT NULL REFERENCES extension_licenses(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (license_id, device_id)
);

ALTER TABLE extension_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_license_devices ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only the service role (admin client)
-- reads or writes these tables.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename='extension_licenses' AND policyname='extension_licenses_service_only') THEN
    CREATE POLICY extension_licenses_service_only ON extension_licenses
      FOR ALL TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename='extension_license_devices' AND policyname='extension_license_devices_service_only') THEN
    CREATE POLICY extension_license_devices_service_only ON extension_license_devices
      FOR ALL TO authenticated USING (false);
  END IF;
END $$;
