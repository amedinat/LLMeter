import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Set up budget alerts and anomaly detection
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No alerts configured</CardTitle>
          <CardDescription>
            Create your first alert to get notified about spending thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Alert types: Monthly budget limit, daily threshold, anomaly detection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
