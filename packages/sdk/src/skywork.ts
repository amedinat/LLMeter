import type { LLMeter } from './client.js';

/**
 * Minimal shape of a SkyWork AI chat completion response.
 * SkyWork AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface SkyWorkCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a SkyWork AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * SkyWork AI by Kunlun Tech (昆仑万维, SZSE: 300418) — China's largest gaming company's AI pivot.
 * Founded in 2008 in Beijing, Kunlun launched Tiangong (天工) AI assistant in 2023.
 * The SkyWork brand includes Tiangong-2 (256K context flagship), SkyWork-o1-Preview
 * (chain-of-thought reasoning model, DeepSeek-R1 equivalent), SkyWork MoE 20B,
 * and budget models down to SkyWork-7B-Chat at $0.06/1M — 97% cheaper than GPT-4o.
 * OpenAI-compatible API at api.tiangong.cn/v1.
 *
 * Zero-dependency: uses duck-typing, no SkyWork-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSkyWork } from 'llmeter';
 *
 * const skywork = new OpenAI({
 *   apiKey: process.env.SKYWORK_API_KEY,
 *   baseURL: 'https://api.tiangong.cn/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSkyWork = wrapSkyWork(skywork, llmeter);
 *
 * // All calls through trackedSkyWork are automatically tracked
 * const completion = await trackedSkyWork.chat.completions.create(
 *   {
 *     model: 'tiangong-2',
 *     messages: [{ role: 'user', content: 'Hello from SkyWork!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapSkyWork<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SkyWorkCompletion>;
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
  ): Promise<SkyWorkCompletion> => {
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
