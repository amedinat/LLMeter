import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Google AI generateContent response we need.
 * Works with `@google/generative-ai` npm package.
 */
interface GoogleGenerateContentResult {
  response: {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
    };
  };
}

/**
 * Minimal shape of a wrapped GenerativeModel we expose.
 * generateContent accepts an optional second arg for LLMeter options.
 */
interface WrappedGoogleModel {
  generateContent(
    request: unknown,
    options?: { llmeter_customer_id?: string }
  ): Promise<GoogleGenerateContentResult>;
}

/**
 * Minimal shape of the GoogleGenerativeAI client.
 * Matches `@google/generative-ai` v0.21+.
 */
interface GoogleGenerativeAIClient {
  getGenerativeModel(
    config: { model: string; [key: string]: unknown },
    requestOptions?: unknown
  ): { generateContent(...args: unknown[]): Promise<GoogleGenerateContentResult> };
}

/**
 * Wraps `new GoogleGenerativeAI()` to automatically track usage on every
 * `model.generateContent()` call.
 *
 * Because the Google AI SDK does not expose a per-call `options` argument on
 * `generateContent`, LLMeter injects an optional second argument.  The real
 * SDK never sees it — the wrapper strips it before forwarding the call.
 *
 * @example
 * ```ts
 * import { GoogleGenerativeAI } from '@google/generative-ai';
 * import LLMeter, { wrapGoogleAI } from 'llmeter';
 *
 * const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGenAI = wrapGoogleAI(genAI, llmeter);
 *
 * // All calls through trackedGenAI are automatically tracked
 * const model = trackedGenAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
 * const result = await model.generateContent('Explain quantum computing', {
 *   llmeter_customer_id: 'user_abc123',   // stripped before forwarding
 * });
 * ```
 */
export function wrapGoogleAI<T extends GoogleGenerativeAIClient>(
  client: T,
  tracker: LLMeter,
  defaultCustomerId = 'anonymous'
): T & { getGenerativeModel(config: { model: string; [k: string]: unknown }, requestOptions?: unknown): WrappedGoogleModel } {
  const originalGetModel = client.getGenerativeModel.bind(client);

  const wrappedGetModel = (
    config: { model: string; [key: string]: unknown },
    requestOptions?: unknown
  ): WrappedGoogleModel => {
    const modelName = config.model;
    const realModel = originalGetModel(config, requestOptions);

    const wrappedGenerateContent = async (
      request: unknown,
      options?: { llmeter_customer_id?: string }
    ): Promise<GoogleGenerateContentResult> => {
      const customerId = options?.llmeter_customer_id ?? defaultCustomerId;

      // Forward the call without llmeter options (Google SDK doesn't know about them)
      const result = await realModel.generateContent(request);

      const meta = result?.response?.usageMetadata;
      if (meta !== undefined) {
        tracker.track({
          model: modelName,
          inputTokens: meta.promptTokenCount ?? 0,
          outputTokens: meta.candidatesTokenCount ?? 0,
          customerId,
        });
      }

      return result;
    };

    return new Proxy(realModel, {
      get(target, prop) {
        if (prop === 'generateContent') {
          return wrappedGenerateContent;
        }
        return (target as Record<string | symbol, unknown>)[prop];
      },
    }) as WrappedGoogleModel;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'getGenerativeModel') {
        return wrappedGetModel;
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  }) as T & { getGenerativeModel(config: { model: string; [k: string]: unknown }, requestOptions?: unknown): WrappedGoogleModel };
}
