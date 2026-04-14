'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

interface Props {
  token: string;
  email: string;
  orgName: string;
  isLoggedIn: boolean;
}

export function AcceptInviteClient({ token, email, orgName, isLoggedIn }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-accept if already logged in with correct email
  useEffect(() => {
    if (isLoggedIn) {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/team/invite/${token}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept invite');
      }
      router.push('/dashboard?welcome=team');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setAccepting(false);
    }
  };

  if (isLoggedIn && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Joining {orgName}…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle>You&apos;re invited to join {orgName}</CardTitle>
          <CardDescription>
            Accept this invite to collaborate on LLMeter with your team.
            <br />
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          {!isLoggedIn ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Sign in or create an account with <strong>{email}</strong> to accept.
              </p>
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/login?next=/team-invite/${token}&email=${encodeURIComponent(email)}`,
                  )
                }
              >
                Sign in to Accept
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Accepting…' : 'Accept Invite'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
