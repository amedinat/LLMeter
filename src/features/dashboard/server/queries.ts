import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { getUserPlan, getRetentionDate } from '@/lib/feature-gate';
import type { SpendSummary, DailySpend, ProviderType } from '@/types';
import { PROVIDER_META } from '@/lib/providers/types';

export async function getSpendSummary(days = 30): Promise<SpendSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const plan = await getUserPlan();
  const retentionDate = getRetentionDate(plan);
  const retentionDateStr = format(retentionDate, 'yyyy-MM-dd');

  const now = new Date();
  const DAY_MS = 86_400_000;

  // Rolling window: last N days for current period, previous N days for comparison
  const currentStart = format(new Date(now.getTime() - days * DAY_MS), 'yyyy-MM-dd');
  const prevStart = format(new Date(now.getTime() - days * 2 * DAY_MS), 'yyyy-MM-dd');
  const prevEnd = currentStart;

  // Apply retention filter
  const effectiveCurrentStart = retentionDateStr > currentStart ? retentionDateStr : currentStart;
  const effectivePrevStart = retentionDateStr > prevStart ? retentionDateStr : prevStart;

  // If retention date is after the end of previous period, previous period data is not available
  const prevMonthAvailable = retentionDateStr <= prevEnd;

  // Fetch current period data (last N days)
  const { data: currentData, error: currentError } = await supabase
    .from('usage_records')
    .select(`
      cost_usd,
      requests,
      model,
      provider:providers(provider, display_name)
    `)
    .eq('user_id', user.id)
    .gte('date', effectiveCurrentStart);

  if (currentError) {
    console.error('Error fetching current month usage:', currentError);
    return emptySummary();
  }

  // Fetch previous month data for comparison
  let prevData: { cost_usd: number }[] = [];
  if (prevMonthAvailable) {
    const { data, error: prevError } = await supabase
      .from('usage_records')
      .select('cost_usd')
      .eq('user_id', user.id)
      .gte('date', effectivePrevStart)
      .lt('date', prevEnd);

    if (prevError) {
      console.error('Error fetching previous month usage:', prevError);
    } else {
      prevData = data || [];
    }
  }

  // Calculate totals
  const totalSpend = currentData.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const prevSpend = prevData.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  
  // Avoid division by zero or absurd percentages from tiny previous values
  const changePct = prevSpend < 0.01
    ? (totalSpend > 0 ? 100 : 0)
    : ((totalSpend - prevSpend) / prevSpend) * 100;

  // Group by Provider
  const providerMap = new Map<string, { spend: number, name: string, type: ProviderType }>();
  
  // Group by Model
  const modelMap = new Map<string, { spend: number, requests: number, provider: ProviderType }>();

  currentData.forEach(r => {
    const providerData = Array.isArray(r.provider) ? r.provider[0] : r.provider;
    const providerType = (providerData?.provider || 'openai') as ProviderType;
    const providerName = PROVIDER_META[providerType]?.name || providerData?.display_name || providerType;

    // Provider aggregation
    const prevProv = providerMap.get(providerType) || { spend: 0, name: providerName, type: providerType };
    prevProv.spend += (r.cost_usd || 0);
    providerMap.set(providerType, prevProv);

    // Model aggregation
    const prevModel = modelMap.get(r.model) || { spend: 0, requests: 0, provider: providerType };
    prevModel.spend += (r.cost_usd || 0);
    prevModel.requests += (r.requests || 0);
    modelMap.set(r.model, prevModel);
  });

  const byProvider = Array.from(providerMap.values()).map(p => ({
    provider: p.type,
    display_name: p.name,
    spend: p.spend,
    pct: totalSpend > 0 ? (p.spend / totalSpend) * 100 : 0
  })).sort((a, b) => b.spend - a.spend);

  const byModel = Array.from(modelMap.entries()).map(([model, data]) => ({
    model,
    provider: data.provider,
    spend: data.spend,
    requests: data.requests,
    pct: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0
  })).sort((a, b) => b.spend - a.spend);

  return {
    total_spend: totalSpend,
    previous_period_spend: prevSpend,
    change_pct: changePct,
    by_provider: byProvider,
    by_model: byModel
  };
}

export async function getDailySpend(days = 30): Promise<DailySpend[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const plan = await getUserPlan();
  const retentionDate = getRetentionDate(plan);
  const retentionDateStr = format(retentionDate, 'yyyy-MM-dd');

  const now = new Date();
  const DAY_MS = 86_400_000;
  const startDate = format(new Date(now.getTime() - days * DAY_MS), 'yyyy-MM-dd');

  const effectiveStartDate = retentionDateStr > startDate ? retentionDateStr : startDate;

  const { data, error } = await supabase
    .from('usage_records')
    .select(`
      date, 
      cost_usd,
      provider:providers(provider)
    `)
    .eq('user_id', user.id)
    .gte('date', effectiveStartDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily spend:', error);
    return [];
  }

  // Group by date
  const dateMap = new Map<string, DailySpend>();

  data.forEach(r => {
    const providerData = Array.isArray(r.provider) ? r.provider[0] : r.provider;
    const providerType = (providerData?.provider || 'openai') as ProviderType;
    
    if (!dateMap.has(r.date)) {
      dateMap.set(r.date, {
        date: r.date,
        total: 0,
        by_provider: {
          openai: 0,
          anthropic: 0,
          google: 0,
          deepseek: 0,
          openrouter: 0,
          mistral: 0,
        }
      });
    }

    const entry = dateMap.get(r.date)!;
    entry.total += (r.cost_usd || 0);
    if (entry.by_provider[providerType] !== undefined) {
      entry.by_provider[providerType] += (r.cost_usd || 0);
    }
  });

  // Fill in missing dates with zero values so chart shows full range
  const result: DailySpend[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const dateStr = format(d, 'yyyy-MM-dd');
    result.push(
      dateMap.get(dateStr) ?? {
        date: dateStr,
        total: 0,
        by_provider: {
          openai: 0,
          anthropic: 0,
          google: 0,
          deepseek: 0,
          openrouter: 0,
          mistral: 0,
        },
      }
    );
  }

  return result;
}

function emptySummary(): SpendSummary {
  return {
    total_spend: 0,
    previous_period_spend: 0,
    change_pct: 0,
    by_provider: [],
    by_model: []
  };
}
