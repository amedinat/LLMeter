'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, Loader2, Pencil, Trash2, ArrowLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

interface CustomerSummary {
  customer_id: string;
  display_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  total_records: number;
  total_cost: number;
}

export default function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMetadata, setEditMetadata] = useState('');
  const [metadataError, setMetadataError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openEdit = (customer: CustomerSummary) => {
    setEditName(customer.display_name ?? customer.customer_id);
    setEditMetadata(customer.metadata ? JSON.stringify(customer.metadata, null, 2) : '{}');
    setMetadataError('');
    setEditOpen(true);
  };

  const validateMetadata = (value: string): boolean => {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setMetadataError('Metadata must be a JSON object');
        return false;
      }
      setMetadataError('');
      return true;
    } catch {
      setMetadataError('Invalid JSON');
      return false;
    }
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    if (!validateMetadata(editMetadata)) return;

    setSaving(true);
    try {
      const res = await apiFetch(`/api/customers/${selectedCustomer.customer_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: editName,
          metadata: JSON.parse(editMetadata),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to update customer (${res.status})`);
      }

      toast.success('Customer updated');
      setEditOpen(false);
      setSelectedCustomer((prev) =>
        prev
          ? { ...prev, display_name: editName, metadata: JSON.parse(editMetadata) }
          : null
      );
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    setDeleting(true);
    try {
      const res = await apiFetch(`/api/customers/${selectedCustomer.customer_id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete customer (${res.status})`);
      }

      toast.success('Customer deleted');
      setDeleteOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Detail view
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedCustomer.display_name ?? selectedCustomer.customer_id}
            </h1>
            <p className="text-muted-foreground text-sm">
              ID: {selectedCustomer.customer_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openEdit(selectedCustomer)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total Records</CardDescription>
              <CardTitle className="text-2xl">{selectedCustomer.total_records}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total Cost</CardDescription>
              <CardTitle className="text-2xl">
                ${selectedCustomer.total_cost.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Created</CardDescription>
              <CardTitle className="text-2xl">
                {new Date(selectedCustomer.created_at).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {selectedCustomer.metadata &&
          Object.keys(selectedCustomer.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted p-4 text-sm overflow-auto">
                  {JSON.stringify(selectedCustomer.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update the display name and metadata for this customer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <textarea
                  id="metadata"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                  value={editMetadata}
                  onChange={(e) => {
                    setEditMetadata(e.target.value);
                    if (metadataError) validateMetadata(e.target.value);
                  }}
                  placeholder='{"key": "value"}'
                />
                {metadataError && (
                  <p className="text-sm text-destructive">{metadataError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !editName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;
                {selectedCustomer.display_name ?? selectedCustomer.customer_id}
                &rdquo;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage customers tracked via the ingestion API
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>No customers yet</CardTitle>
            <CardDescription>
              Customers will appear here once usage data is ingested via the API.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Card
              key={c.customer_id}
              className="cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => setSelectedCustomer(c)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium truncate">
                    {c.display_name ?? c.customer_id}
                  </CardTitle>
                  <Badge variant="secondary">
                    <DollarSign className="mr-1 h-3 w-3" />
                    {c.total_cost.toFixed(2)}
                  </Badge>
                </div>
                <CardDescription className="truncate">
                  {c.customer_id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{c.total_records} records</span>
                  <span>
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
