import { DashboardClient } from './dashboard-client';
import { getSpendSummary, getDailySpend } from '@/features/dashboard/server/queries';

export default async function DashboardPage() {
  const summary = await getSpendSummary();
  const dailyData = await getDailySpend();

  return <DashboardClient summary={summary} dailyData={dailyData} />;
}
