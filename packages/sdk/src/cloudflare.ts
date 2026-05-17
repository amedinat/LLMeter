import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Cloudflare Workers AI chat completion response.
 * Cloudflare Workers AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface CloudflareCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Cloudflare Workers AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Cloudflare Workers AI exposes an OpenAI-compatible endpoint — works with the `openai`
 * npm package pointing at your account's Workers AI base URL. Zero-dependency: uses
 * duck-typing, no Cloudflare SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCloudflare } from 'llmeter';
 *
 * const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
 * const cloudflare = new OpenAI({
 *   apiKey: process.env.CLOUDFLARE_API_TOKEN,
 *   baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCF = wrapCloudflare(cloudflare, llmeter);
 *
 * // All calls through trackedCF are automatically tracked
 * const completion = await trackedCF.chat.completions.create(
 *   {
 *     model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCloudflare<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CloudflareCompletion>;
      };
    };
  }
>(client: T, tracker: LLMeter, defaultCustomerId = 'anonymous'): T {
  const originalCreate = client.chat.completions.create.bind(
    client.chat.completions
  );

  const wrappedCreate = async (
    params: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<CloudflareCompletion> => {
    const customerId =
      (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(
      params,
      Object.keys(cleanOptions ?? {}).length > 0 ? cleanOptions : undefined
    );

    if (result.usage) {
      tracker.track({
        model: result.model,
        inputTokens: result.usage.prompt_tokens,
        outputTokens: result.usage.completion_tokens,
        customerId,
      });
    }

    return result;
  };

  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'chat') {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === 'completions') {
              return new Proxy(chatTarget.completions, {
                get(completionsTarget, completionsProp) {
                  if (completionsProp === 'create') {
                    return wrappedCreate;
                  }
                  return (completionsTarget as Record<string | symbol, unknown>)[
                    completionsProp
                  ];
                },
              });
            }
            return (chatTarget as Record<string | symbol, unknown>)[chatProp];
          },
        });
      }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
}
