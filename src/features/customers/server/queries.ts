import { createClient } from '@/lib/supabase/server';

export interface CustomerSummary {
  customer_id: string;
  display_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  total_records: number;
  total_cost: number;
}

export interface CustomerDetail {
  customer_id: string;
  user_id: string;
  display_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function getCustomersSummary(userId: string): Promise<CustomerSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('customer_id, display_name, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  // For each customer, get aggregated usage stats
  const summaries: CustomerSummary[] = [];
  for (const customer of data ?? []) {
    const { count } = await supabase
      .from('customer_usage_records')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customer.customer_id)
      .eq('user_id', userId);

    const { data: costData } = await supabase
      .from('customer_usage_records')
      .select('cost_usd')
      .eq('customer_id', customer.customer_id)
      .eq('user_id', userId);

    const totalCost = (costData ?? []).reduce(
      (sum, r) => sum + (typeof r.cost_usd === 'number' ? r.cost_usd : 0),
      0
    );

    summaries.push({
      ...customer,
      total_records: count ?? 0,
      total_cost: totalCost,
    });
  }

  return summaries;
}

export async function getCustomerDetail(
  userId: string,
  customerId: string
): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customers')
    .select('customer_id, user_id, display_name, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }

  return data;
}
