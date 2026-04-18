import type {
  UsageEvent,
  WireEvent,
  IngestResponse,
  LLMeterOptions,
  ResolvedOptions,
} from './types.js';

const DEFAULT_BASE_URL = 'https://llmeter.org/api/ingest';
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_FLUSH_INTERVAL_MS = 5_000;
const DEFAULT_MAX_RETRIES = 3;

function toWireEvent(event: UsageEvent): WireEvent {
  return {
    model: event.model,
    input_tokens: event.inputTokens,
    output_tokens: event.outputTokens,
    customer_id: event.customerId,
    ...(event.timestamp ? { timestamp: event.timestamp } : {}),
  };
}

function resolveOptions(options: LLMeterOptions): ResolvedOptions {
  const apiKey =
    options.apiKey ??
    (typeof process !== 'undefined' ? process.env?.LLMETER_API_KEY : undefined) ??
    '';

  return {
    apiKey,
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    batchSize: options.batchSize ?? DEFAULT_BATCH_SIZE,
    flushInterval: options.flushInterval ?? DEFAULT_FLUSH_INTERVAL_MS,
    maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
    silent: options.silent ?? false,
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * LLMeter SDK client.
 *
 * @example
 * ```ts
 * import LLMeter from 'llmeter';
 *
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 *
 * // Track a single call
 * await llmeter.track({
 *   model: 'gpt-4o',
 *   inputTokens: 120,
 *   outputTokens: 340,
 *   customerId: 'user_abc123',
 * });
 *
 * // Flush remaining events before your process exits
 * await llmeter.flush();
 * ```
 */
export class LLMeter {
  private readonly opts: ResolvedOptions;
  private readonly buffer: WireEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private closed = false;

  constructor(options: LLMeterOptions = {}) {
    this.opts = resolveOptions(options);

    if (!this.opts.apiKey) {
      this.warn(
        'LLMeter: no API key provided. Set apiKey option or LLMETER_API_KEY env var.'
      );
    }

    if (this.opts.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        void this.flush();
      }, this.opts.flushInterval);

      // Allow the process to exit normally even if the timer is still running
      if (typeof this.flushTimer === 'object' && this.flushTimer !== null && 'unref' in this.flushTimer) {
        (this.flushTimer as { unref(): void }).unref();
      }
    }
  }

  /**
   * Track a single LLM usage event.
   * Events are buffered and sent in batches.
   * If the buffer reaches `batchSize`, an immediate flush is triggered.
   */
  track(event: UsageEvent): void {
    if (this.closed) {
      this.warn('LLMeter: client is closed. Call was ignored.');
      return;
    }

    this.buffer.push(toWireEvent(event));

    if (this.buffer.length >= this.opts.batchSize) {
      void this.flush();
    }
  }

  /**
   * Track a single event and wait for it to be sent.
   * Useful when you need a fire-and-await pattern.
   */
  async trackAsync(event: UsageEvent): Promise<void> {
    this.track(event);
    await this.flush();
  }

  /**
   * Flush all buffered events to the LLMeter API immediately.
   * Safe to call concurrently — only one flush runs at a time.
   */
  async flush(): Promise<IngestResponse | null> {
    if (this.buffer.length === 0) return null;
    if (this.flushing) {
      // Wait for the ongoing flush to finish, then ours will be a no-op
      await sleep(50);
      return null;
    }

    this.flushing = true;
    const events = this.buffer.splice(0, this.buffer.length);

    try {
      return await this.sendWithRetry(events);
    } finally {
      this.flushing = false;
    }
  }

  /**
   * Flush all remaining events and stop the auto-flush timer.
   * Call this before your process exits to avoid losing buffered events.
   */
  async shutdown(): Promise<void> {
    this.closed = true;
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  private async sendWithRetry(
    events: WireEvent[],
    attempt = 0
  ): Promise<IngestResponse | null> {
    try {
      const res = await fetch(this.opts.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.opts.apiKey}`,
        },
        body: JSON.stringify(events),
      });

      if (res.ok) {
        return (await res.json()) as IngestResponse;
      }

      // Retryable: rate-limited or server error
      if ((res.status === 429 || res.status >= 500) && attempt < this.opts.maxRetries) {
        const retryAfter = res.status === 429
          ? parseInt(res.headers.get('Retry-After') ?? '1', 10)
          : Math.pow(2, attempt); // exponential back-off for 5xx

        await sleep(retryAfter * 1_000);
        return this.sendWithRetry(events, attempt + 1);
      }

      // Non-retryable error
      if (!this.opts.silent) {
        const body = await res.text();
        console.error(`LLMeter: ingest failed (${res.status}): ${body}`);
      }
      return null;
    } catch (err) {
      if (attempt < this.opts.maxRetries) {
        await sleep(Math.pow(2, attempt) * 1_000);
        return this.sendWithRetry(events, attempt + 1);
      }
      this.warn(`LLMeter: ingest error after ${attempt + 1} attempts: ${String(err)}`);
      return null;
    }
  }

  private warn(message: string): void {
    if (!this.opts.silent) {
      console.warn(message);
    }
  }
}
