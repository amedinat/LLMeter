import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AcceptInviteClient } from './accept-invite-client';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function TeamInvitePage({ params }: Props) {
  const { token } = await params;

  // Fetch invite details server-side
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/team/invite/${token}`,
    { cache: 'no-store' },
  );

  if (!res.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Invalid Invite</h1>
          <p className="text-muted-foreground">This invite link is invalid or has already been used.</p>
          <a href="/login" className="text-sm underline">Sign in to LLMeter</a>
        </div>
      </div>
    );
  }

  const invite = await res.json() as { email: string; orgName: string; memberId: string };

  // Check if already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in and email matches, auto-accept and redirect
  if (user && user.email?.toLowerCase() === invite.email.toLowerCase()) {
    // Let client handle the accept call so we can show feedback
  } else if (user && user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Wrong Account</h1>
          <p className="text-muted-foreground">
            This invite was sent to <strong>{invite.email}</strong>. You are signed in as{' '}
            <strong>{user.email}</strong>.
          </p>
          <a href="/login" className="text-sm underline">Sign in with the correct account</a>
        </div>
      </div>
    );
  }

  return (
    <AcceptInviteClient
      token={token}
      email={invite.email}
      orgName={invite.orgName}
      isLoggedIn={!!user}
    />
  );
}
