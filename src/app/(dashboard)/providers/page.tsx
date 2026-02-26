'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Eye, EyeOff, Loader2, Key, Wifi, WifiOff, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { providerTypes } from '@/lib/validators/provider';

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  deepseek: 'DeepSeek',
};

interface ProviderRow {
  id: string;
  provider: string;
  display_name: string | null;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [formProvider, setFormProvider] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      } else {
        toast.error('Failed to load providers');
      }
    } catch {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  // Poll for syncing providers — stop when none are syncing
  useEffect(() => {
    const hasSyncing = providers.some((p) => p.status === 'syncing');

    if (hasSyncing && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchProviders();
      }, 5000);
    } else if (!hasSyncing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [providers, fetchProviders]);

  const resetForm = () => {
    setFormProvider('');
    setFormApiKey('');
    setFormDisplayName('');
    setShowKey(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProvider || formApiKey.length < 10) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formProvider,
          apiKey: formApiKey,
          displayName: formDisplayName || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || `Failed to connect (${res.status})`);
      }

      // Check sync result from the response
      if (body.sync?.error) {
        toast.error(`Data sync failed: ${body.sync.error}`, {
          description: 'The API key is valid but we couldn\'t fetch usage data. You can retry from the card.',
          duration: 8000,
        });
      } else if (body.provider?.status === 'active') {
        const count = body.sync?.records ?? 0;
        toast.success(`Provider active — ${count} usage record${count !== 1 ? 's' : ''} imported`);
      } else {
        toast.info('Provider saved — syncing usage data...');
      }

      setOpen(false);
      resetForm();
      fetchProviders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProvider = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to disconnect provider');
      }

      setProviders((prev) => prev.filter((p) => p.id !== id));
      toast.success('Provider disconnected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDeletingId(null);
    }
  };

  const retrySync = async (id: string) => {
    setRetryingId(id);

    // Optimistically set to syncing
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'syncing' } : p))
    );

    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || 'Retry failed');
      }

      if (body.status === 'active') {
        toast.success(`Sync complete — ${body.records ?? 0} records imported`);
      } else {
        toast.info('Sync started, refreshing...');
      }

      fetchProviders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Retry failed');
      fetchProviders(); // Refresh to get real status
    } finally {
      setRetryingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <Wifi className="h-3.5 w-3.5" /> Active
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing data…
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Sync failed
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <WifiOff className="h-3.5 w-3.5" /> Disconnected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <WifiOff className="h-3.5 w-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground">
            Connect your AI API providers to start tracking costs
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect a Provider</DialogTitle>
              <DialogDescription>
                Enter your API key to start tracking usage and costs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={formProvider} onValueChange={setFormProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerTypes.map((p) => (
                      <SelectItem key={p} value={p}>
                        {providerLabels[p] || p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (optional)</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Production Key"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    className="pr-10"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    required
                    minLength={10}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key is encrypted before storage and never shown again.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !formProvider || formApiKey.length < 10}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect Provider
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
      ) : providers.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>No providers connected</CardTitle>
            <CardDescription>
              Connect your first provider to start seeing your AI spending data.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className={p.status === 'error' ? 'border-red-300 dark:border-red-800' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {p.display_name || providerLabels[p.provider] || p.provider}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {(p.status === 'error' || p.status === 'syncing') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                      onClick={() => retrySync(p.id)}
                      disabled={retryingId === p.id}
                      aria-label="Retry sync"
                      title="Retry sync"
                    >
                      {retryingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteProvider(p.id)}
                    disabled={deletingId === p.id}
                    aria-label="Disconnect provider"
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{providerLabels[p.provider] || p.provider}</span>
                  <span>&middot;</span>
                  {statusBadge(p.status)}
                </div>
                {p.status === 'error' && (
                  <div className="mt-2 rounded-md bg-red-50 dark:bg-red-950/30 p-2">
                    <p className="text-xs text-red-700 dark:text-red-400">
                      {p.last_error || 'Could not sync usage data from this provider.'}
                    </p>
                    <p className="mt-1 text-xs text-red-600/70 dark:text-red-400/70">
                      Your API key is saved. Click ↻ to retry.
                    </p>
                  </div>
                )}
                {p.last_sync_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last sync: {new Date(p.last_sync_at).toLocaleString()}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Added {new Date(p.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
