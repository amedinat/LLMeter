"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Trash2, Loader2, RefreshCcw, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Provider {
  id: string;
  provider: string;
  display_name: string | null;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
}

const PROVIDER_INFO: Record<string, { name: string; color: string; keyPlaceholder: string; helpUrl: string }> = {
  openai: { name: "OpenAI", color: "#10A37F", keyPlaceholder: "sk-...", helpUrl: "https://platform.openai.com/api-keys" },
  anthropic: { name: "Anthropic", color: "#D4A574", keyPlaceholder: "sk-ant-admin-...", helpUrl: "https://console.anthropic.com/settings/keys" },
  google: { name: "Google AI", color: "#4285F4", keyPlaceholder: "AIza...", helpUrl: "https://console.cloud.google.com/apis/credentials" },
  deepseek: { name: "DeepSeek", color: "#0066FF", keyPlaceholder: "sk-...", helpUrl: "https://platform.deepseek.com/api_keys" },
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  error: "bg-red-500",
  disconnected: "bg-gray-400",
  syncing: "bg-yellow-500",
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Form state
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [displayName, setDisplayName] = useState("");

  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/providers");
      if (!res.ok) throw new Error("Failed to fetch providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {
      toast.error("No se pudieron cargar los proveedores.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("API key es requerida.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "true",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
          displayName: displayName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to connect provider");
      }

      toast.success("Proveedor conectado correctamente.");
      setOpen(false);
      setApiKey("");
      setDisplayName("");
      setSelectedProvider("openai");
      fetchProviders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteProvider(id: string, name: string) {
    if (!confirm(`¿Desconectar ${name}? Se eliminará la API key almacenada.`)) return;

    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": "true" },
      });

      if (!res.ok) throw new Error("Failed to disconnect provider");

      setProviders((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proveedor desconectado.");
    } catch {
      toast.error("No se pudo desconectar el proveedor.");
    }
  }

  const info = PROVIDER_INFO[selectedProvider];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground">
            Connect your AI API providers to start tracking costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchProviders} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Connect Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Connect Provider</DialogTitle>
                <DialogDescription>
                  Enter your API key to start tracking costs for this provider.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-select">Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger id="provider-select">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="google">Google AI</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={info?.keyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    minLength={10}
                  />
                  {info?.helpUrl && (
                    <a
                      href={info.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      Get your API key <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name (optional)</Label>
                  <Input
                    id="display-name"
                    placeholder="My OpenAI Key"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && providers.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading providers...</p>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-1 text-center">
            <Link2 className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-semibold">No providers connected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect your first AI provider to start tracking your API spending across all models.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Connect Provider
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const meta = PROVIDER_INFO[provider.provider];
            return (
              <Card key={provider.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: meta?.color ?? "#666" }}
                    />
                    <CardTitle className="text-base font-medium">
                      {provider.display_name || meta?.name || provider.provider}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${statusColors[provider.status] ?? "bg-gray-400"}`} />
                    {provider.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(provider.created_at).toLocaleDateString()}
                    </p>
                    {provider.last_sync_at && (
                      <p className="text-xs text-muted-foreground">
                        Last synced {new Date(provider.last_sync_at).toLocaleDateString()}
                      </p>
                    )}
                    {provider.last_error && (
                      <p className="text-xs text-red-500 truncate" title={provider.last_error}>
                        Error: {provider.last_error}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteProvider(provider.id, meta?.name || provider.provider)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
