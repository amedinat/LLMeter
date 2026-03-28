import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCustomersSummary } from '@/features/customers/server/queries';

/**
 * GET /api/customers — List all customers with summary stats
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await getCustomersSummary(user.id);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('GET /api/customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
