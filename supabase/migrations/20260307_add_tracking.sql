-- Add last_seen_at to profiles for retention tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Create user_events table for engagement tracking
CREATE TABLE IF NOT EXISTS user_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying events by user and time
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_event ON user_events(event);

-- Index for retention queries on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON profiles(last_seen_at);

-- RLS policies for user_events
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own events
CREATE POLICY "Users can insert own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only read their own events
CREATE POLICY "Users can read own events"
  ON user_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can read all events (for analytics)
CREATE POLICY "Service role can read all events"
  ON user_events FOR SELECT
  USING (auth.role() = 'service_role');
