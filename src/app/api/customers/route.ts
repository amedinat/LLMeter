import { NextResponse } from 'next/server';
import { getCustomersSummary } from '@/features/customers/server/queries';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start') || undefined;
    const end = searchParams.get('end') || undefined;

    const customers = await getCustomersSummary(start, end);
    return NextResponse.json({ customers });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
