/**
 * SaaS Pulse SDK - Lightweight client for tracking KPIs
 * Sends events to the SaaS Pulse dashboard's /api/ingest endpoint.
 * Fire-and-forget: never blocks the main flow.
 */

interface SaasPulseConfig {
  projectSlug: string;
  apiKey: string;
  ingestUrl: string;
}

class SaasPulse {
  private apiKey: string;
  private ingestUrl: string;
  private projectSlug: string;

  constructor(config: SaasPulseConfig) {
    this.projectSlug = config.projectSlug;
    this.apiKey = config.apiKey;
    this.ingestUrl = config.ingestUrl.replace(/\/$/, "");
  }

  private async send(
    type: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const res = await fetch(this.ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ type, project_slug: this.projectSlug, data }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`[SaasPulse] ${type} failed (${res.status}): ${body}`);
      }
    } catch (err) {
      console.error(`[SaasPulse] ${type} error:`, err);
    }
  }

  async track(
    event: string,
    options?: {
      user_ref?: string;
      amount_cents?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!event) return;
    const metadata: Record<string, unknown> = { ...options?.metadata };
    await this.send("event", {
      event,
      user_ref: options?.user_ref,
      amount_cents:
        options?.amount_cents != null ? Number(options.amount_cents) : undefined,
      metadata,
    });
  }

  async metric(
    metric: string,
    value: number,
    date?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!metric || typeof value !== "number" || !isFinite(value)) return;
    await this.send("metric", {
      metric,
      value,
      date: date || new Date().toISOString().split("T")[0],
      metadata: metadata || {},
    });
  }
}

// --- Singleton ---

let _instance: SaasPulse | null = null;

function getInstance(): SaasPulse | null {
  if (_instance) return _instance;

  const url = process.env.NEXT_PUBLIC_SAAS_PULSE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SAAS_PULSE_API_KEY;

  if (!url || !apiKey) {
    // SaaS Pulse not configured — silently skip
    return null;
  }

  _instance = new SaasPulse({
    projectSlug: "llmeter",
    apiKey,
    ingestUrl: `${url}/api/ingest`,
  });

  return _instance;
}

/**
 * Track an event in SaaS Pulse (fire-and-forget).
 * Does nothing if SaaS Pulse env vars are not configured.
 */
export function pulseTrack(
  event: string,
  options?: {
    user_ref?: string;
    amount_cents?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  const pulse = getInstance();
  if (!pulse) return;
  // Fire and forget — don't await
  pulse.track(event, options).catch(() => {});
}

/**
 * Track a daily metric in SaaS Pulse (fire-and-forget).
 */
export function pulseMetric(
  metric: string,
  value: number,
  date?: string
): void {
  const pulse = getInstance();
  if (!pulse) return;
  pulse.metric(metric, value, date).catch(() => {});
}
