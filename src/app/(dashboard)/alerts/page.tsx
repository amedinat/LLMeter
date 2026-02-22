'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Bell, BellOff, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { alertTypes, alertPeriods } from '@/lib/validators/alert';

const alertTypeLabels: Record<string, string> = {
  budget_limit: 'Budget Limit',
  anomaly: 'Anomaly Detection',
  daily_threshold: 'Daily Threshold',
};

const alertTypeIcons: Record<string, React.ReactNode> = {
  budget_limit: <DollarSign className="h-4 w-4" />,
  anomaly: <AlertTriangle className="h-4 w-4" />,
  daily_threshold: <DollarSign className="h-4 w-4" />,
};

const periodLabels: Record<string, string> = {
  daily: 'Daily',
  monthly: 'Monthly',
};

interface AlertRow {
  id: string;
  type: string;
  name: string;
  config: { threshold: number; period: string; providers?: string[] };
  enabled: boolean;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formType, setFormType] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formPeriod, setFormPeriod] = useState('monthly');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resetForm = () => {
    setFormType('');
    setFormThreshold('');
    setFormPeriod('monthly');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const threshold = parseFloat(formThreshold);
    if (!formType || isNaN(threshold) || threshold <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          config: {
            threshold,
            period: formPeriod,
            providers: [],
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create alert (${res.status})`);
      }

      toast.success('Alert created successfully');
      setOpen(false);
      resetForm();
      fetchAlerts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Set up budget alerts and anomaly detection
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Alert</DialogTitle>
              <DialogDescription>
                Get notified when your spending exceeds a threshold.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alertType">Alert Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger id="alertType">
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {alertTypeLabels[t] || t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold ($)</Label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="50.00"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select value={formPeriod} onValueChange={setFormPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {alertPeriods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {periodLabels[p] || p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formType || !formThreshold}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Alert
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>No alerts configured</CardTitle>
            <CardDescription>
              Create your first alert to get notified about spending thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {alertTypeIcons[a.type] || <Bell className="h-4 w-4" />}
                  <CardTitle className="text-base font-medium">
                    {a.name}
                  </CardTitle>
                </div>
                {a.enabled ? (
                  <Bell className="h-4 w-4 text-green-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{alertTypeLabels[a.type] || a.type}</span>
                  <span>&middot;</span>
                  <span>${a.config.threshold.toFixed(2)}</span>
                  <span>&middot;</span>
                  <span className="capitalize">{a.config.period}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {new Date(a.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
