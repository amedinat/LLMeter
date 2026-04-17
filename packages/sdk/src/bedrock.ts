import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Bedrock Converse command input.
 * Matches `ConverseCommandInput` from `@aws-sdk/client-bedrock-runtime`.
 */
interface BedrockConverseInput {
  modelId: string;
  messages?: unknown[];
  [key: string]: unknown;
}

/**
 * Minimal shape of a Bedrock Converse command output.
 * Matches `ConverseCommandOutput` from `@aws-sdk/client-bedrock-runtime`.
 */
interface BedrockConverseOutput {
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  [key: string]: unknown;
}

/**
 * Duck-typed Bedrock command: any object with an `input` property.
 * Used to inspect modelId without importing the AWS SDK.
 */
interface BedrockCommand {
  input?: BedrockConverseInput;
}

/**
 * Minimal shape of a BedrockRuntimeClient.
 * Matches `@aws-sdk/client-bedrock-runtime` v3.
 */
interface BedrockRuntimeClient {
  send(command: unknown, options?: unknown): Promise<unknown>;
}

/**
 * Per-call options accepted by the wrapped `send()` method.
 * `llmeter_customer_id` is stripped before forwarding to Bedrock.
 */
export interface BedrockSendOptions {
  llmeter_customer_id?: string;
  [key: string]: unknown;
}

/**
 * Wraps a `BedrockRuntimeClient.send()` to automatically track usage
 * for **Converse** API calls (`ConverseCommand`).
 *
 * Works with `@aws-sdk/client-bedrock-runtime` v3 without importing it —
 * the wrapper uses duck-typing so `llmeter` stays zero-dependency.
 *
 * Only `ConverseCommand` responses are tracked (standardised token usage).
 * `InvokeModelCommand` is passed through unchanged (model-specific response
 * format makes generic tracking unreliable).
 *
 * @example
 * ```ts
 * import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
 * import LLMeter, { wrapBedrock } from 'llmeter';
 *
 * const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedBedrock = wrapBedrock(bedrock, llmeter);
 *
 * // All ConverseCommand calls through trackedBedrock are automatically tracked
 * const response = await trackedBedrock.send(
 *   new ConverseCommand({
 *     modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
 *     messages: [{ role: 'user', content: [{ text: 'Hello!' }] }],
 *   }),
 *   { llmeter_customer_id: 'user_abc123' } // stripped before forwarding
 * );
 * ```
 */
export function wrapBedrock<T extends BedrockRuntimeClient>(
  client: T,
  tracker: LLMeter,
  defaultCustomerId = 'anonymous'
): T {
  const originalSend = client.send.bind(client);

  const wrappedSend = async (
    command: unknown,
    options?: BedrockSendOptions
  ): Promise<unknown> => {
    // Extract and strip llmeter_customer_id from options
    const customerId = options?.llmeter_customer_id ?? defaultCustomerId;
    const cleanOptions: BedrockSendOptions | undefined = options
      ? { ...options }
      : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = (await originalSend(
      command,
      Object.keys(cleanOptions ?? {}).length > 0 ? cleanOptions : undefined
    )) as BedrockConverseOutput;

    // Track only ConverseCommand responses — they carry standardised token usage.
    // Detection: the command has `input.modelId` AND the response has `usage.inputTokens`.
    const cmd = command as BedrockCommand;
    const modelId = cmd?.input?.modelId;
    const usage = result?.usage;

    if (modelId && usage?.inputTokens !== undefined) {
      tracker.track({
        model: modelId,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        customerId,
      });
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'send') {
        return wrappedSend;
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
