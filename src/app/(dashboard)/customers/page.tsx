import { getCustomersSummary } from '@/features/customers/server/queries';
import { CustomersClient } from '@/features/customers/components/customers-client';
import { format } from 'date-fns';

export default async function CustomersPage() {
  const now = new Date();
  const end = format(now, 'yyyy-MM-dd');
  const start = format(new Date(now.getTime() - 30 * 86_400_000), 'yyyy-MM-dd');

  const customers = await getCustomersSummary(start, end);

  return <CustomersClient customers={customers} initialStart={start} initialEnd={end} />;
}
