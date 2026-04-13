import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCsrfHeader, csrfForbiddenResponse } from '@/lib/security';
import { getUserPlan, hasFeature } from '@/lib/feature-gate';
import { randomBytes } from 'crypto';

const MAX_TEAM_MEMBERS = 5; // including owner

/** GET /api/team — return org + members for the current user (owner view). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plan = await getUserPlan();
  if (!hasFeature(plan, 'team-attribution')) {
    return NextResponse.json({ error: 'Team plan required' }, { status: 403 });
  }

  // Get or create org for this owner
  let { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  if (orgError || !org) {
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({ owner_id: user.id, name: 'My Team' })
      .select('id, name')
      .single();

    if (createError || !newOrg) {
      return NextResponse.json({ error: 'Failed to initialize team' }, { status: 500 });
    }
    org = newOrg;
  }

  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('id, invited_email, role, status, created_at, accepted_at')
    .eq('org_id', org.id)
    .neq('status', 'removed')
    .order('created_at', { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  return NextResponse.json({
    org,
    members: members ?? [],
    maxMembers: MAX_TEAM_MEMBERS,
  });
}

/** POST /api/team — invite a new team member by email. */
export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({})) as { email?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Can't invite yourself
  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
  }

  // Get or create org
  let { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({ owner_id: user.id, name: 'My Team' })
      .select('id')
      .single();

    if (createError || !newOrg) {
      return NextResponse.json({ error: 'Failed to initialize team' }, { status: 500 });
    }
    org = newOrg;
  }

  // Check member count
  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .neq('status', 'removed');

  if ((count ?? 0) >= MAX_TEAM_MEMBERS - 1) {
    return NextResponse.json(
      { error: `Team plan allows up to ${MAX_TEAM_MEMBERS} members (including you)` },
      { status: 422 },
    );
  }

  // Check if already invited
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id, status')
    .eq('org_id', org.id)
    .eq('invited_email', email)
    .neq('status', 'removed')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'This email is already a team member or has a pending invite' }, { status: 409 });
  }

  const inviteToken = randomBytes(32).toString('hex');

  const { data: member, error: insertError } = await supabase
    .from('organization_members')
    .insert({
      org_id: org.id,
      invited_email: email,
      role: 'member',
      status: 'pending',
      invite_token: inviteToken,
    })
    .select('id, invited_email, role, status, created_at')
    .single();

  if (insertError || !member) {
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }

  return NextResponse.json({ member, inviteToken }, { status: 201 });
}
