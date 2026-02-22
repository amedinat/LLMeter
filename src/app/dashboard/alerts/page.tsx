"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Bell, Settings2, Trash2, AlertCircle, CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAlertSchema, type CreateAlertInput, alertTypes, alertPeriods } from "@/lib/validators/alert";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: {
    threshold: number;
    period: string;
    providers?: string[];
  };
  created_at: string;
  recent_events?: any[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const form = useForm<CreateAlertInput>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      type: "budget_limit",
      config: {
        threshold: 100,
        period: "monthly",
      },
    },
  });

  async function onSubmit(values: CreateAlertInput) {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "true", // Custom header for CSRF check as per api/alerts/route.ts
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create alert");
      }

      toast({
        title: "Éxito",
        description: "Alerta creada correctamente.",
      });
      
      setOpen(false);
      form.reset();
      fetchAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleAlert(id: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "true",
        },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (!res.ok) throw new Error("Failed to update alert");

      setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !enabled } : a));
      
      toast({
        title: enabled ? "Alerta desactivada" : "Alerta activada",
        description: `La alerta ha sido ${enabled ? "desactivada" : "activada"} correctamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la alerta.",
        variant: "destructive",
      });
    }
  }

  async function deleteAlert(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "true",
        },
      });

      if (!res.ok) throw new Error("Failed to delete alert");

      setAlerts(prev => prev.filter(a => a.id !== id));
      
      toast({
        title: "Alerta eliminada",
        description: "La alerta ha sido eliminada permanentemente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la alerta.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Alertas</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={fetchAlerts} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nueva Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-width-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Alerta</DialogTitle>
                <DialogDescription>
                  Configura un umbral de gasto para recibir notificaciones automáticas.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Alerta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="budget_limit">Límite de Presupuesto</SelectItem>
                            <SelectItem value="anomaly">Detección de Anomalías</SelectItem>
                            <SelectItem value="daily_threshold">Umbral Diario</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="config.threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Umbral ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="config.period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Periodo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Periodo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Diario</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Crear Alerta
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && alerts.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando alertas...</p>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-lg font-semibold">No tienes alertas</h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primera alerta para monitorear tus costos de APIs.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Alerta
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={!alert.enabled ? "opacity-60" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {alert.name}
                </CardTitle>
                <Badge variant={alert.enabled ? "default" : "secondary"}>
                  {alert.enabled ? "Activa" : "Inactiva"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="mt-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Configuración</p>
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        ${alert.config.threshold} / {alert.config.period}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={alert.enabled} 
                      onCheckedChange={() => toggleAlert(alert.id, alert.enabled)} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {alert.recent_events && alert.recent_events.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Últimas activaciones</p>
                    {alert.recent_events.slice(0, 2).map((event: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <span>{new Date(event.sent_at).toLocaleDateString()}</span>
                        <span className="font-mono">${event.triggered_value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
