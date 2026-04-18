import type { LLMeter } from './client.js';

/**
 * Minimal shape of an Azure OpenAI chat completion response.
 * Azure OpenAI uses the same response format as the `openai` npm package.
 */
interface AzureChatCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an Azure OpenAI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Works with `@azure/openai` (v2+) and the standard `openai` SDK configured
 * with an Azure endpoint — both use the same response shape.
 * Zero-dependency: uses duck-typing, no Azure SDK import required.
 *
 * @example
 * ```ts
 * import { AzureOpenAI } from 'openai';
 * import LLMeter, { wrapAzureOpenAI } from 'llmeter';
 *
 * const azure = new AzureOpenAI({
 *   endpoint: 'https://my-resource.openai.azure.com/',
 *   apiKey: process.env.AZURE_OPENAI_API_KEY,
 *   apiVersion: '2024-02-01',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedAzure = wrapAzureOpenAI(azure, llmeter);
 *
 * // All calls are automatically tracked — llmeter_customer_id is stripped
 * // before forwarding to Azure OpenAI
 * const completion = await trackedAzure.chat.completions.create(
 *   { model: 'gpt-4o', messages: [{ role: 'user', content: 'Hello!' }] },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapAzureOpenAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<AzureChatCompletion>;
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
  ): Promise<AzureChatCompletion> => {
    // Extract and strip llmeter_customer_id — never forwarded to Azure
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
