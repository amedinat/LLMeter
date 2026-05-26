import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Monster API chat completion response.
 * Monster API is OpenAI-compatible — same response format as the `openai` package.
 */
interface MonsterAPICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Monster API client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Monster API is OpenAI-compatible — use the `openai` npm package with the
 * Monster API base URL and your Monster API key.
 * Zero-dependency: uses duck-typing, no Monster API-specific SDK import required.
 *
 * Monster API is an Indian GPU marketplace connecting idle GPU capacity worldwide.
 * Competitive per-token pricing across Llama, Mistral, Gemma, Phi, and Qwen models.
 * Mistral 7B at $0.04/1M tokens — 98% cheaper than GPT-4o input.
 * 6 of 8 models use symmetric (input = output) pricing.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapMonsterAPI } from 'llmeter';
 *
 * const monster = new OpenAI({
 *   apiKey: process.env.MONSTER_API_KEY,
 *   baseURL: 'https://api.monsterapi.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedMonster = wrapMonsterAPI(monster, llmeter);
 *
 * // All calls through trackedMonster are automatically tracked
 * const completion = await trackedMonster.chat.completions.create(
 *   {
 *     model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapMonsterAPI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<MonsterAPICompletion>;
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
  ): Promise<MonsterAPICompletion> => {
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
