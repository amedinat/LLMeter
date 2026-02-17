import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground">
            Connect your AI API providers to start tracking costs
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Connect Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No providers connected</CardTitle>
          <CardDescription>
            Connect your first provider to start seeing your AI spending data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Supported providers: OpenAI, Anthropic. More coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
