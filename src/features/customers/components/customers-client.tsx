'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, DollarSign, Users, Hash, Calendar, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import type { CustomerSummary, CustomerDailySpend, CustomerModelUsage } from '@/types';
import { CustomerTrendChart } from './customer-trend-chart';
import { CustomerModelTable } from './customer-model-table';

interface CustomersClientProps {
  customers: CustomerSummary[];
  initialStart: string;
  initialEnd: string;
}

type DateRange = '7d' | '30d' | '90d' | 'custom';

const RANGES: { label: string; value: DateRange; days: number }[] = [
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const days = RANGES.find(r => r.value === range)?.days ?? 30;
  const start = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return { start, end };
}

export function CustomersClient({ customers: initialCustomers, initialStart, initialEnd }: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [range, setRange] = useState<DateRange>('30d');
  const [customStart, setCustomStart] = useState(initialStart);
  const [customEnd, setCustomEnd] = useState(initialEnd);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<{
    summary: CustomerSummary;
    dailySpend: CustomerDailySpend[];
    modelUsage: CustomerModelUsage[];
  } | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMetadata, setEditMetadata] = useState('');
  const [metadataError, setMetadataError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalCost = customers.reduce((s, c) => s + c.total_cost, 0);
  const totalRequests = customers.reduce((s, c) => s + c.request_count, 0);

  async function fetchCustomers(start: string, end: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchDrillDown(customerId: string, start: string, end: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setDrillDown(data);
        setSelectedCustomer(customerId);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRangeChange(newRange: DateRange) {
    setRange(newRange);
    if (newRange !== 'custom') {
      const { start, end } = getDateRange(newRange);
      setCustomStart(start);
      setCustomEnd(end);
      if (selectedCustomer) {
        fetchDrillDown(selectedCustomer, start, end);
      } else {
        fetchCustomers(start, end);
      }
    }
  }

  function handleCustomDateApply() {
    setRange('custom');
    if (selectedCustomer) {
      fetchDrillDown(selectedCustomer, customStart, customEnd);
    } else {
      fetchCustomers(customStart, customEnd);
    }
  }

  function handleBack() {
    setSelectedCustomer(null);
    setDrillDown(null);
    const { start, end } = range === 'custom'
      ? { start: customStart, end: customEnd }
      : getDateRange(range);
    fetchCustomers(start, end);
  }

  function handleCustomerClick(customerId: string) {
    const { start, end } = range === 'custom'
      ? { start: customStart, end: customEnd }
      : getDateRange(range);
    fetchDrillDown(customerId, start, end);
  }

  // --- CRUD helpers ---

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

  const openEdit = (customerId: string, displayName: string | null) => {
    setEditName(displayName ?? customerId);
    setEditMetadata('{}');
    setMetadataError('');
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;
    if (!validateMetadata(editMetadata)) return;

    setSaving(true);
    try {
      const res = await apiFetch(`/api/customers/${selectedCustomer}`, {
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
      // Refresh drill-down
      const { start, end } = range === 'custom'
        ? { start: customStart, end: customEnd }
        : getDateRange(range);
      fetchDrillDown(selectedCustomer, start, end);
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
      const res = await apiFetch(`/api/customers/${selectedCustomer}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to delete customer (${res.status})`);
      }

      toast.success('Customer deleted');
      setDeleteOpen(false);
      handleBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Drill-down view
  if (selectedCustomer && drillDown) {
    const displayName = drillDown.summary?.display_name || selectedCustomer;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2 -ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Customers
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-muted-foreground">Customer ID: {selectedCustomer}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openEdit(selectedCustomer, drillDown.summary?.display_name ?? null)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Date filters */}
        <DateFilters
          range={range}
          customStart={customStart}
          customEnd={customEnd}
          onRangeChange={handleRangeChange}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          onApply={handleCustomDateApply}
        />

        {/* Stats */}
        {drillDown.summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Cost"
              value={`$${drillDown.summary.total_cost.toFixed(4)}`}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="Requests"
              value={formatNumber(drillDown.summary.request_count)}
              icon={<Hash className="h-4 w-4" />}
            />
            <StatCard
              title="Input Tokens"
              value={formatNumber(drillDown.summary.total_input_tokens)}
              icon={<Hash className="h-4 w-4" />}
            />
            <StatCard
              title="Last Active"
              value={formatDate(drillDown.summary.last_active)}
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Trend chart */}
        <CustomerTrendChart data={drillDown.dailySpend} />

        {/* Model breakdown */}
        <CustomerModelTable data={drillDown.modelUsage} />

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
                Are you sure you want to delete &ldquo;{displayName}&rdquo;? This action cannot be undone.
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

  // Customer list view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Usage and cost attribution by customer</p>
      </div>

      {/* Date filters */}
      <DateFilters
        range={range}
        customStart={customStart}
        customEnd={customEnd}
        onRangeChange={handleRangeChange}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onApply={handleCustomDateApply}
      />

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Customers"
          value={customers.length.toString()}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Cost"
          value={`$${totalCost.toFixed(4)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Total Requests"
          value={formatNumber(totalRequests)}
          icon={<Hash className="h-4 w-4" />}
        />
      </div>

      {/* Customer table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Customer Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Input Tokens</TableHead>
                <TableHead className="text-right">Output Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">% Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const pct = totalCost > 0 ? (c.total_cost / totalCost) * 100 : 0;
                return (
                  <TableRow
                    key={c.customer_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCustomerClick(c.customer_id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {c.display_name || c.customer_id}
                        </div>
                        {c.display_name && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {c.customer_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(c.request_count)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(c.total_input_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(c.total_output_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      ${c.total_cost.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-muted-foreground">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No customer usage data yet. Use the ingestion API to send usage records.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

interface DateFiltersProps {
  range: DateRange;
  customStart: string;
  customEnd: string;
  onRangeChange: (range: DateRange) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
  onApply: () => void;
}

function DateFilters({
  range,
  customStart,
  customEnd,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
  onApply,
}: DateFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onRangeChange(r.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              range === r.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={customStart}
          onChange={(e) => onCustomStartChange(e.target.value)}
          className="h-7 w-36 text-xs"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={customEnd}
          onChange={(e) => onCustomEndChange(e.target.value)}
          className="h-7 w-36 text-xs"
        />
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}
