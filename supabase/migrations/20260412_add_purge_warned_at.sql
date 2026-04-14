-- Track when a free-plan user was warned about upcoming data purge
-- so we don't send duplicate warning emails.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS purge_warned_at timestamptz;

-- Index for the purge cron job: find free users inactive for 30+ days
CREATE INDEX IF NOT EXISTS idx_profiles_free_inactive
  ON profiles (plan, last_seen_at)
  WHERE plan = 'free';
