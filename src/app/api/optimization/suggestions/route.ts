import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@/lib/feature-gate';
import { generateSuggestions } from '@/lib/optimization/engine';
import type { UsageRecord } from '@/types';
import { format, subDays } from 'date-fns';

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getUserPlan();
    const limits = getPlanLimits(plan);

    const fromDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const { data: records, error } = await supabase
      .from('usage_records')
      .select('id, provider_id, user_id, date, model, input_tokens, output_tokens, requests, cost_usd, created_at')
      .eq('user_id', user.id)
      .gte('date', fromDate);

    if (error) {
      console.error('Error fetching usage records for optimization:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const usageRecords: UsageRecord[] = (records ?? []).map(r => ({
      ...r,
      input_tokens: r.input_tokens ?? 0,
      output_tokens: r.output_tokens ?? 0,
      requests: r.requests ?? 0,
      cost_usd: r.cost_usd ?? 0,
    }));

    // Aggregate monthly projections per model (mirrors engine's internal aggregation)
    const modelAgg = new Map<string, { cost: number; requests: number; dates: Set<string> }>();
    for (const r of usageRecords) {
      const prev = modelAgg.get(r.model) ?? { cost: 0, requests: 0, dates: new Set<string>() };
      prev.cost += r.cost_usd;
      prev.requests += r.requests;
      prev.dates.add(r.date);
      modelAgg.set(r.model, prev);
    }

    const modelMonthly = new Map<string, { cost: number; requests: number }>();
    for (const [model, agg] of modelAgg) {
      const days = agg.dates.size || 1;
      modelMonthly.set(model, {
        cost: (agg.cost / days) * 30,
        requests: Math.round((agg.requests / days) * 30),
      });
    }

    const rawSuggestions = generateSuggestions(usageRecords, plan);

    const suggestions = rawSuggestions.map(s => {
      const monthly = modelMonthly.get(s.current_model);
      const currentCost = monthly?.cost ?? 0;
      const suggestedCost = Math.max(0, currentCost - s.estimated_monthly_savings_usd);
      return {
        model_current: s.current_model,
        model_suggested: s.suggested_model,
        monthly_requests: monthly?.requests ?? 0,
        current_cost_usd: Math.round(currentCost * 100) / 100,
        suggested_cost_usd: Math.round(suggestedCost * 100) / 100,
        savings_pct: s.savings_percentage,
        reasoning: s.reasoning,
        status: s.status,
      };
    });

    const maxSuggestions = isFinite(limits.maxOptimizationSuggestions)
      ? limits.maxOptimizationSuggestions
      : null;

    return NextResponse.json({ suggestions, plan, maxSuggestions, totalPossible: suggestions.length });
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csrf = req.headers.get('x-csrf-token');
    if (!csrf) {
      return NextResponse.json({ error: 'Missing CSRF token' }, { status: 403 });
    }

    // Status updates acknowledged (suggestion state is transient — no persistence table yet)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
