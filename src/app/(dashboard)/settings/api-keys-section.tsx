'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Key, Copy, Trash2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  description: string | null;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/api-keys');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKeys(data.keys);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const generateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNewKey(data.key);
      setDescription('');
      fetchKeys();
      toast.success('API key generated');
    } catch {
      toast.error('Failed to generate API key');
    } finally {
      setGenerating(false);
    }
  };

  const revokeKey = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: false } : k)));
      toast.success('API key revoked');
    } catch {
      toast.error('Failed to revoke API key');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setNewKey(null);
      setDescription('');
      setCopied(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to LLMeter
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Generate New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {newKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Generated</DialogTitle>
                    <DialogDescription>
                      This key will only be shown once. Copy it now.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={newKey}
                        className="font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(newKey)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-amber-400">
                      Store this key securely. You won&apos;t be able to see it again.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogChange(false)}>
                      Done
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Generate New API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key for ingesting usage data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="key-description">Description (optional)</Label>
                      <Input
                        id="key-description"
                        placeholder="e.g. Production backend"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogChange(false)}>
                      Cancel
                    </Button>
                    <Button onClick={generateKey} disabled={generating}>
                      {generating ? 'Generating...' : 'Generate Key'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading API keys...</p>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No API keys yet. Generate one to start ingesting usage data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Key className="h-4 w-4 shrink-0 text-cyan-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {apiKey.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Created {format(new Date(apiKey.created_at), 'MMM d, yyyy')}</span>
                      {apiKey.last_used_at && (
                        <span>Last used {format(new Date(apiKey.last_used_at), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                    {apiKey.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                  {apiKey.is_active && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => revokeKey(apiKey.id)}
                      disabled={revoking === apiKey.id}
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
