import type { LLMeter } from './client.js';

/**
 * Minimal shape of an InternLM chat completion response.
 * InternLM is OpenAI-compatible — same response format as the `openai` package.
 */
interface InternLMCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an InternLM client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * InternLM is developed by Shanghai AI Laboratory (上海人工智能实验室) — a major
 * Chinese research institution founded 2020, backed by Alibaba, Tencent, ByteDance,
 * and Sequoia China. InternLM2/3 are top-ranked on C-Eval, CMMLU, and HumanEval
 * benchmarks. InternVL2 is among the best open-source vision-language models globally.
 * OpenAI-compatible API at internlm-chat.intern-ai.org.cn/puyu/api/v1.
 *
 * Zero-dependency: uses duck-typing, no InternLM-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapInternLM } from 'llmeter';
 *
 * const internlm = new OpenAI({
 *   apiKey: process.env.INTERNLM_API_KEY,
 *   baseURL: 'https://internlm-chat.intern-ai.org.cn/puyu/api/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedInternLM = wrapInternLM(internlm, llmeter);
 *
 * // All calls through trackedInternLM are automatically tracked
 * const completion = await trackedInternLM.chat.completions.create(
 *   {
 *     model: 'internlm3-8b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from InternLM!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapInternLM<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<InternLMCompletion>;
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
  ): Promise<InternLMCompletion> => {
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
