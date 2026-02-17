import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loginWithMagicLink } from '@/features/auth/actions/login';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { message, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">LLMeter</CardTitle>
          <CardDescription>
            Monitor your AI API costs in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive dark:bg-destructive/25">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-900 dark:bg-green-900/20 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <p>{message}</p>
            </div>
          )}

          <form action={loginWithMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Send Magic Link
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
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
