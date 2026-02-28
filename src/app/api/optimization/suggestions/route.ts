import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan, getPlanLimits } from '@/lib/feature-gate';
import { generateSuggestions } from '@/lib/optimization/engine';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import type { UsageRecord, SuggestionStatus } from '@/types';

const OPTIMIZATION_API_LIMIT = { limit: 20, windowMs: 60_000 };

/**
 * GET /api/optimization/suggestions
 * Generate and return optimization suggestions based on user's usage data.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await getUserPlan();

    // Fetch usage records from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageData, error: usageError } = await supabase
      .from('usage_records')
      .select('date, model, input_tokens, output_tokens, requests, cost_usd')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true });

    if (usageError) {
      console.error('Failed to fetch usage records:', usageError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Generate suggestions from engine
    const suggestions = generateSuggestions(
      (usageData ?? []) as UsageRecord[],
      plan
    );

    // Also fetch any previously saved suggestion statuses
    const { data: savedStatuses } = await supabase
      .from('optimization_suggestions')
      .select('model_current, model_suggested, status')
      .eq('user_id', user.id);

    // Merge saved statuses into generated suggestions
    const statusMap = new Map<string, SuggestionStatus>();
    for (const s of savedStatuses ?? []) {
      statusMap.set(`${s.model_current}|${s.model_suggested}`, s.status);
    }

    const enrichedSuggestions = suggestions.map((s) => {
      const key = `${s.model_current}|${s.model_suggested}`;
      const savedStatus = statusMap.get(key);
      return {
        ...s,
        status: savedStatus ?? s.status,
      };
    });

    const limits = getPlanLimits(plan);

    return NextResponse.json({
      suggestions: enrichedSuggestions,
      plan,
      maxSuggestions: limits.maxOptimizationSuggestions === Infinity
        ? null
        : limits.maxOptimizationSuggestions,
      totalPossible: enrichedSuggestions.length,
    });
  } catch (error) {
    console.error('Error generating optimization suggestions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/optimization/suggestions
 * Update suggestion status (applied/dismissed).
 * Body: { model_current, model_suggested, status }
 */
export async function PATCH(request: NextRequest) {
  try {
    const csrfError = verifyCsrfHeader(request);
    if (csrfError) return csrfForbiddenResponse();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = checkRateLimit(`optimization:${user.id}`, OPTIMIZATION_API_LIMIT);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { model_current, model_suggested, status } = body;

    if (!model_current || !model_suggested || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: model_current, model_suggested, status' },
        { status: 400 }
      );
    }

    const validStatuses: SuggestionStatus[] = ['pending', 'applied', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert: update if exists, insert if not
    const { error } = await supabase
      .from('optimization_suggestions')
      .upsert(
        {
          user_id: user.id,
          model_current,
          model_suggested,
          status,
        },
        { onConflict: 'user_id,model_current,model_suggested' }
      );

    if (error) {
      console.error('Failed to update suggestion status:', error);
      return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error updating optimization suggestion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
