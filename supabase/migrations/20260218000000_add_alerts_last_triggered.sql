-- Add last_triggered_at to alerts table for dedup logic
alter table public.alerts
  add column if not exists last_triggered_at timestamptz;
