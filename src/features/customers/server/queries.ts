import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import type { CustomerSummary, CustomerDailySpend, CustomerModelUsage } from '@/types';

export async function getCustomersSummary(
  startDate?: string,
  endDate?: string
): Promise<CustomerSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const defaultStart = format(new Date(now.getTime() - 30 * 86_400_000), 'yyyy-MM-dd');
  const effectiveStart = startDate || defaultStart;
  const effectiveEnd = endDate || format(now, 'yyyy-MM-dd');

  let query = supabase
    .from('customer_usage_records')
    .select('customer_id, cost_usd, input_tokens, output_tokens, timestamp')
    .eq('user_id', user.id)
    .gte('timestamp', `${effectiveStart}T00:00:00`)
    .lte('timestamp', `${effectiveEnd}T23:59:59`)
    .order('timestamp', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching customer usage:', error);
    return [];
  }

  // Aggregate by customer_id
  const customerMap = new Map<string, {
    total_cost: number;
    total_input_tokens: number;
    total_output_tokens: number;
    request_count: number;
    last_active: string;
  }>();

  (data || []).forEach(r => {
    const prev = customerMap.get(r.customer_id) || {
      total_cost: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      request_count: 0,
      last_active: r.timestamp,
    };
    prev.total_cost += Number(r.cost_usd) || 0;
    prev.total_input_tokens += r.input_tokens || 0;
    prev.total_output_tokens += r.output_tokens || 0;
    prev.request_count += 1;
    if (r.timestamp > prev.last_active) prev.last_active = r.timestamp;
    customerMap.set(r.customer_id, prev);
  });

  // Fetch display names from customers table
  const customerIds = Array.from(customerMap.keys());
  let displayNames = new Map<string, string | null>();

  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('customer_id, display_name')
      .eq('user_id', user.id)
      .in('customer_id', customerIds);

    (customers || []).forEach(c => {
      displayNames.set(c.customer_id, c.display_name);
    });
  }

  return Array.from(customerMap.entries())
    .map(([customer_id, stats]) => ({
      customer_id,
      display_name: displayNames.get(customer_id) || null,
      ...stats,
    }))
    .sort((a, b) => b.total_cost - a.total_cost);
}

export async function getCustomerDetail(
  customerId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  summary: CustomerSummary | null;
  dailySpend: CustomerDailySpend[];
  modelUsage: CustomerModelUsage[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const defaultStart = format(new Date(now.getTime() - 30 * 86_400_000), 'yyyy-MM-dd');
  const effectiveStart = startDate || defaultStart;
  const effectiveEnd = endDate || format(now, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('customer_usage_records')
    .select('customer_id, model, provider, cost_usd, input_tokens, output_tokens, timestamp')
    .eq('user_id', user.id)
    .eq('customer_id', customerId)
    .gte('timestamp', `${effectiveStart}T00:00:00`)
    .lte('timestamp', `${effectiveEnd}T23:59:59`)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching customer detail:', error);
    return { summary: null, dailySpend: [], modelUsage: [] };
  }

  if (!data || data.length === 0) {
    return { summary: null, dailySpend: [], modelUsage: [] };
  }

  // Fetch display name
  const { data: customerMeta } = await supabase
    .from('customers')
    .select('display_name')
    .eq('user_id', user.id)
    .eq('customer_id', customerId)
    .single();

  // Aggregate summary
  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let lastActive = '';

  // Daily aggregation
  const dailyMap = new Map<string, number>();
  // Model aggregation
  const modelMap = new Map<string, { provider: string | null; cost: number; input_tokens: number; output_tokens: number; request_count: number }>();

  data.forEach(r => {
    const cost = Number(r.cost_usd) || 0;
    totalCost += cost;
    totalInput += r.input_tokens || 0;
    totalOutput += r.output_tokens || 0;
    if (r.timestamp > lastActive) lastActive = r.timestamp;

    // Daily
    const day = r.timestamp.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + cost);

    // Model
    const prev = modelMap.get(r.model) || { provider: r.provider, cost: 0, input_tokens: 0, output_tokens: 0, request_count: 0 };
    prev.cost += cost;
    prev.input_tokens += r.input_tokens || 0;
    prev.output_tokens += r.output_tokens || 0;
    prev.request_count += 1;
    modelMap.set(r.model, prev);
  });

  const summary: CustomerSummary = {
    customer_id: customerId,
    display_name: customerMeta?.display_name || null,
    total_cost: totalCost,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    request_count: data.length,
    last_active: lastActive,
  };

  const dailySpend: CustomerDailySpend[] = Array.from(dailyMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const modelUsage: CustomerModelUsage[] = Array.from(modelMap.entries())
    .map(([model, stats]) => ({
      model,
      provider: stats.provider,
      cost: stats.cost,
      input_tokens: stats.input_tokens,
      output_tokens: stats.output_tokens,
      request_count: stats.request_count,
      pct: totalCost > 0 ? (stats.cost / totalCost) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  return { summary, dailySpend, modelUsage };
}
