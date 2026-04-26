-- Waitlist for product validation pages (e.g., /validate/budget-guard).
-- Captures pre-launch interest from public landing pages — no auth required to insert.

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  ip_hash text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_source ON waitlist(lower(email), source);
CREATE INDEX IF NOT EXISTS idx_waitlist_source_created ON waitlist(source, created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- No public SELECT, INSERT, UPDATE, or DELETE policies.
-- The /api/waitlist route uses the service role key (admin client) to insert,
-- which bypasses RLS. This keeps anon users from reading or modifying signups.
