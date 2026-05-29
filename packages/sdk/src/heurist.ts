import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Heurist chat completion response.
 * Heurist is OpenAI-compatible — same response format as the `openai` package.
 */
interface HeuristCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Heurist client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Heurist AI (heurist.ai) is a decentralized AI inference network built on
 * Ethereum ZK (L2 zero-knowledge proofs). Idle GPU resources are rewarded via
 * smart contracts. 4th blockchain network on LLMeter after Corcel (Bittensor),
 * io.net (Solana), and Akash (Cosmos). OpenAI-compatible API at
 * llm-gateway.heurist.xyz/v1. Mistral 7B at $0.04/1M — 98% cheaper than GPT-4o.
 *
 * Zero-dependency: uses duck-typing, no Heurist-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHeurist } from 'llmeter';
 *
 * const heurist = new OpenAI({
 *   apiKey: process.env.HEURIST_API_KEY,
 *   baseURL: 'https://llm-gateway.heurist.xyz/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHeurist = wrapHeurist(heurist, llmeter);
 *
 * // All calls through trackedHeurist are automatically tracked
 * const completion = await trackedHeurist.chat.completions.create(
 *   {
 *     model: 'meta-llama/llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Heurist!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapHeurist<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HeuristCompletion>;
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
  ): Promise<HeuristCompletion> => {
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
