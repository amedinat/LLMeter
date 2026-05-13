import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, hasFeature } from '@/lib/feature-gate';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

const ASSIGNABLE_ROLES: MemberRole[] = ['admin', 'member', 'viewer'];

/** PATCH /api/team/members/[id] — change a member's role (owner only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (!hasFeature(plan, 'team-attribution')) {
    return NextResponse.json({ error: 'Team plan required' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { role?: unknown };
  const role = body.role as MemberRole | undefined;

  if (!role || !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const { id: memberId } = await params;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('id', memberId)
    .eq('org_id', org.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (member.role === 'owner') {
    return NextResponse.json({ error: 'Cannot change the role of the organization owner' }, { status: 422 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId)
    .select('id, invited_email, role, status')
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ member: updated });
}

/** DELETE /api/team/members/[id] — remove a team member (owner only). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyCsrfHeader(request)) {
    return csrfForbiddenResponse();
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (!hasFeature(plan, 'team-attribution')) {
    return NextResponse.json({ error: 'Team plan required' }, { status: 403 });
  }

  const { id: memberId } = await params;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('id', memberId)
    .eq('org_id', org.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  if (member.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 422 });
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ status: 'removed' })
    .eq('id', memberId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
