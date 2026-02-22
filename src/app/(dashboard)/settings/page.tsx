import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { User, Mail, Calendar, CreditCard } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan ?? 'free';
  const name = profile?.name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
  const email = user.email ?? '';
  const createdAt = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details and subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Member since</p>
              <p className="text-sm text-muted-foreground">{createdAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Current Plan</p>
              <Badge variant={plan === 'free' ? 'secondary' : 'default'}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </Badge>
            </div>
          </div>
          {plan === 'free' && (
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro for team features, advanced alerts, and extended data retention.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
