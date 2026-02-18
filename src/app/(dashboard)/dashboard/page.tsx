import { DashboardClient } from './dashboard-client';

export default function DashboardPage() {
  // In production, this will fetch from Supabase via server component
  // For now, data is generated client-side via fixtures
  return <DashboardClient />;
}
