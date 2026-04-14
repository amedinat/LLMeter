import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';

/** GET /api/team/invite/[token] — get invite details (public, no auth required). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = await createClient();
  const { token } = await params;

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, invited_email, status, org_id, organizations(name)')
    .eq('invite_token', token)
    .single();

  if (!member || member.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  const orgName = (member.organizations as { name?: string } | null)?.name ?? 'a team';

  return NextResponse.json({
    email: member.invited_email,
    orgName,
    memberId: member.id,
  });
}

/** POST /api/team/invite/[token]/accept — accept an invite (requires auth). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await params;

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, invited_email, status')
    .eq('invite_token', token)
    .single();

  if (!member || member.status !== 'pending') {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
  }

  if (member.invited_email !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address' },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({
      user_id: user.id,
      status: 'active',
      invite_token: null,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', member.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
