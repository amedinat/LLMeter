import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loginWithMagicLink, loginWithPassword, signUpWithPassword } from '@/features/auth/actions/login';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; tab?: string }>;
}) {
  const { message, error, tab } = await searchParams;
  const defaultTab = tab === 'password' ? 'password' : 'magic-link';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            <Link href="/" className="hover:opacity-80 transition-opacity text-cyan-400">LLMeter</Link>
          </CardTitle>
          <CardDescription>
            Monitor your AI API costs in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-green-900/20 p-3 text-sm text-green-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="magic-link" className="space-y-4 pt-4">
              <form action={loginWithMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white">
                  Send Magic Link
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                We&apos;ll send a login link to your email. No password needed.
              </p>
            </TabsContent>

            <TabsContent value="password" className="space-y-4 pt-4">
              <form action={loginWithPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                    Sign In
                  </Button>
                  <Button type="submit" variant="outline" className="flex-1" formAction={signUpWithPassword}>
                    Sign Up
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" disabled>
            Google (coming soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
