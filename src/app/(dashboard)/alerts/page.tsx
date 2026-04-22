'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Bell, AlertTriangle, DollarSign, Trash2, Slack, Send } from 'lucide-react';
import { toast } from 'sonner';
import { alertTypes, alertPeriods } from '@/lib/validators/alert';

const alertTypeLabels: Record<string, string> = {
  budget_limit: 'Budget Limit',
  anomaly: 'Anomaly Detection',
  daily_threshold: 'Daily Threshold',
};

const alertTypeDescriptions: Record<string, string> = {
  budget_limit: 'Triggers when total spend exceeds your limit',
  anomaly: 'Detects unusual spending spikes automatically',
  daily_threshold: 'Triggers when daily spend exceeds your limit',
};

const alertTypeFormDescriptions: Record<string, string> = {
  budget_limit:
    'Triggers when your accumulated spending exceeds a dollar amount over a chosen period (daily or monthly).',
  daily_threshold:
    'Triggers when your spending in a single day exceeds the specified dollar amount.',
  anomaly:
    'Triggers when today\u2019s spending is unusually high compared to your last 14 days. Lower sensitivity values (e.g. 1.5) catch smaller changes, higher values (e.g. 3.0) only trigger on major spikes. Default: 2.0.',
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
  config: { threshold: number; period: string; providers?: string[]; slack_webhook_url?: string };
  enabled: boolean;
  created_at: string;
}

function getThresholdInputProps(formType: string) {
  switch (formType) {
    case 'anomaly':
      return {
        label: 'Sensitivity Level',
        placeholder: '2.0',
        step: '0.1',
        min: '0.5',
        max: '5.0',
      };
    case 'daily_threshold':
      return {
        label: 'Threshold ($)',
        placeholder: '10.00',
        step: '0.01',
        min: '0.01',
        max: undefined,
      };
    case 'budget_limit':
    default:
      return {
        label: 'Threshold ($)',
        placeholder: '50.00',
        step: '0.01',
        min: '0.01',
        max: undefined,
      };
  }
}

function formatAlertDisplay(alert: AlertRow) {
  switch (alert.type) {
    case 'anomaly':
      return `Sensitivity: ${alert.config.threshold}`;
    case 'daily_threshold':
      return `$${alert.config.threshold.toFixed(2)} / day`;
    case 'budget_limit':
    default:
      return `$${alert.config.threshold.toFixed(2)} / ${periodLabels[alert.config.period] || alert.config.period}`;
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [formPeriod, setFormPeriod] = useState('monthly');
  const [formSlackWebhook, setFormSlackWebhook] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const resetForm = () => {
    setFormType('');
    setFormThreshold('');
    setFormPeriod('monthly');
    setFormSlackWebhook('');
  };

  const showPeriodSelector = formType === 'budget_limit';
  const effectivePeriod = formType === 'budget_limit' ? formPeriod : 'daily';
  const thresholdProps = getThresholdInputProps(formType);

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
            period: effectivePeriod,
            providers: [],
            ...(formSlackWebhook.trim() ? { slack_webhook_url: formSlackWebhook.trim() } : {}),
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

  const toggleAlert = async (alert: AlertRow) => {
    setTogglingId(alert.id);
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !alert.enabled }),
      });

      if (!res.ok) {
        throw new Error('Failed to update alert');
      }

      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, enabled: !a.enabled } : a))
      );
      toast.success(alert.enabled ? 'Alert disabled' : 'Alert enabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  };

  const sendTestAlert = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Failed to send test (${res.status})`);
      }

      toast.success(body.message || 'Test email sent — check your inbox');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test');
    } finally {
      setTestingId(null);
    }
  };

  const deleteAlert = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to delete alert');
      }

      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
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
                {formType && (
                  <p className="text-xs text-muted-foreground">
                    {alertTypeFormDescriptions[formType]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">{thresholdProps.label}</Label>
                <Input
                  id="threshold"
                  type="number"
                  step={thresholdProps.step}
                  min={thresholdProps.min}
                  max={thresholdProps.max}
                  placeholder={thresholdProps.placeholder}
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  required
                />
              </div>

              {showPeriodSelector && (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="slackWebhook" className="flex items-center gap-2">
                  <Slack className="h-3.5 w-3.5" />
                  Slack Webhook URL
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">PRO</span>
                </Label>
                <Input
                  id="slackWebhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={formSlackWebhook}
                  onChange={(e) => setFormSlackWebhook(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Receive alerts in Slack via an incoming webhook. Pro plan required.
                </p>
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
            <Card key={a.id} className={!a.enabled ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {alertTypeIcons[a.type] || <Bell className="h-4 w-4" />}
                  <CardTitle className="text-base font-medium">
                    {a.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={() => toggleAlert(a)}
                    disabled={togglingId === a.id}
                    aria-label={a.enabled ? 'Disable alert' : 'Enable alert'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => sendTestAlert(a.id)}
                    disabled={testingId === a.id}
                    aria-label="Send test email"
                    title="Send test email"
                  >
                    {testingId === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAlert(a.id)}
                    disabled={deletingId === a.id}
                    aria-label="Delete alert"
                  >
                    {deletingId === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{alertTypeLabels[a.type] || a.type}</span>
                  <span>&middot;</span>
                  <span>{formatAlertDisplay(a)}</span>
                </div>
                {alertTypeDescriptions[a.type] && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alertTypeDescriptions[a.type]}
                  </p>
                )}
                {a.config.slack_webhook_url && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Slack className="h-3 w-3" />
                    <span>Slack notifications enabled</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {(a.created_at ? new Date(a.created_at).toLocaleDateString() : "Pending")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
