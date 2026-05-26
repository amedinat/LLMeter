import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Codestral chat completion response.
 * Codestral API is OpenAI-compatible — same response format as the `openai` package.
 */
interface CodestralCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Codestral client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Codestral API is OpenAI-compatible — use the `openai` npm package with the
 * Codestral base URL and your Mistral API key.
 * Zero-dependency: uses duck-typing, no Codestral-specific SDK import required.
 *
 * Codestral is Mistral AI's dedicated code generation endpoint at codestral.mistral.ai.
 * Supports Fill-in-the-Middle (FIM) for IDE code completion in 80+ programming languages.
 * Includes Devstral for agentic software engineering tasks (SWE-bench top performer).
 * Track code AI spend separately from chat AI spend in LLMeter.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapCodestral } from 'llmeter';
 *
 * // Codestral is OpenAI-compatible — use your Mistral API key
 * const codestral = new OpenAI({
 *   apiKey: process.env.MISTRAL_API_KEY,
 *   baseURL: 'https://codestral.mistral.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedCodestral = wrapCodestral(codestral, llmeter);
 *
 * // All calls through trackedCodestral are automatically tracked
 * const completion = await trackedCodestral.chat.completions.create(
 *   {
 *     model: 'codestral-2501',
 *     messages: [{ role: 'user', content: 'Write a TypeScript quicksort.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapCodestral<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<CodestralCompletion>;
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
  ): Promise<CodestralCompletion> => {
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
