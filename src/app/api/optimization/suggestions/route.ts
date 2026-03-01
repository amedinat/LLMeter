import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/feature-gate';
import { generateOptimizationSuggestions } from '@/features/optimization/server/engine';
import { getSpendSummary } from '@/features/dashboard/server/queries';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getUserPlan();
    
    // In a real scenario, we would fetch usage records specifically for optimization.
    // For now, let's reuse the summary logic and map it back.
    const summary = await getSpendSummary();

    // Map spend summary to a structure suitable for the engine.
    // NormalizedUsageRecord expects date, model, tokens, etc.
    // Here we'll simplify and pass a mock if summary is empty.
    const mockUsage = summary.by_model.map(m => ({
      date: new Date().toISOString().slice(0, 10),
      model: m.model,
      inputTokens: m.spend / 0.000015, // Mock token counts based on spend
      outputTokens: m.spend / 0.000075,
      requests: m.requests,
      costUsd: m.spend
    }));

    const suggestions = generateOptimizationSuggestions(mockUsage as any, plan);

    return NextResponse.json({ suggestions, plan });
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
