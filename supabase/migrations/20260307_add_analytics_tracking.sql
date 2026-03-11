-- Add last_seen_at to profiles for retention tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON profiles(last_seen_at);

-- Create user_events table for engagement tracking
CREATE TABLE IF NOT EXISTS user_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_created ON user_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_event_name ON user_events(event_name, created_at);

-- Enable RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON user_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users can read own events" ON user_events
  FOR SELECT USING (auth.uid() = user_id);
