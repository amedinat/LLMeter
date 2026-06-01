import type { LLMeter } from './client.js';

/**
 * Minimal shape of an OctoAI chat completion response.
 * OctoAI uses an OpenAI-compatible API format.
 */
interface OctoAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps an OctoAI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * OctoAI — San Francisco, CA. Founded 2018 as OctoML by Luis Ceze, Thierry Moreau,
 * and Tianqi Chen (creator of Apache TVM neural network compiler and XGBoost).
 * $132M raised (a16z, Amplify Partners, Madrona Venture Group).
 * Apache TVM automatically optimizes neural network kernels for target hardware —
 * achieving better inference efficiency than standard CUDA for specific
 * model+hardware combinations. Llama 3.1 8B at $0.05/1M — 98% cheaper than GPT-4o.
 * OpenAI-compatible API at text.octoai.run/v1.
 *
 * Zero-dependency: uses duck-typing, no OctoAI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapOctoAI } from 'llmeter';
 *
 * const octoai = new OpenAI({
 *   apiKey: process.env.OCTOAI_API_KEY,
 *   baseURL: 'https://text.octoai.run/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedOctoAI = wrapOctoAI(octoai, llmeter);
 *
 * // All calls through trackedOctoAI are automatically tracked
 * const completion = await trackedOctoAI.chat.completions.create(
 *   {
 *     model: 'meta-llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from OctoAI!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapOctoAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<OctoAICompletion>;
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
  ): Promise<OctoAICompletion> => {
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
