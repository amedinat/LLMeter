/**
 * A single LLM usage event to be tracked.
 */
export interface UsageEvent {
  /** Model identifier, e.g. "gpt-4o", "claude-3-5-sonnet-20241022" */
  model: string;
  /** Number of input/prompt tokens consumed */
  inputTokens: number;
  /** Number of output/completion tokens consumed */
  outputTokens: number;
  /** Your customer or user identifier (for per-customer attribution) */
  customerId: string;
  /** ISO-8601 timestamp of when the LLM call occurred. Defaults to now. */
  timestamp?: string;
}

/** Raw event as sent over the wire (snake_case to match the API) */
export interface WireEvent {
  model: string;
  input_tokens: number;
  output_tokens: number;
  customer_id: string;
  timestamp?: string;
}

/** Response from the ingest endpoint */
export interface IngestResponse {
  success: boolean;
  ingested: number;
}

/** Options for the LLMeter client */
export interface LLMeterOptions {
  /**
   * Your LLMeter API key (starts with "lm_").
   * Can also be set via the LLMETER_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL of the LLMeter ingest endpoint.
   * Defaults to https://llmeter.org/api/ingest
   */
  baseUrl?: string;

  /**
   * Maximum number of events to accumulate before auto-flushing.
   * Set to 1 to disable batching. Defaults to 50.
   */
  batchSize?: number;

  /**
   * Auto-flush interval in milliseconds.
   * Set to 0 to disable the timer. Defaults to 5000 (5 seconds).
   */
  flushInterval?: number;

  /**
   * Number of retry attempts on transient errors (429, 5xx).
   * Defaults to 3.
   */
  maxRetries?: number;

  /**
   * Whether to suppress all console warnings/errors from the SDK.
   * Defaults to false.
   */
  silent?: boolean;
}

/** Internal resolved config (all fields required) */
export interface ResolvedOptions {
  apiKey: string;
  baseUrl: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  silent: boolean;
}
