import type { LLMeter } from './client.js';

/**
 * Minimal shape of a NexusFlow chat completion response.
 * NexusFlow uses an OpenAI-compatible API format.
 */
interface NexusFlowCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a NexusFlow client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * NexusFlow — Berkeley, CA. Founded 2023 by Shishir Patil (Berkeley PhD, lead
 * author of the Gorilla LLM paper), Tianjun Zhang (Berkeley PhD, Apache Spark /
 * Ray contributor), and Lianmin Zheng (Berkeley PhD, creator of vLLM — the
 * inference engine powering Together AI, Fireworks, and dozens of LLMeter providers).
 *
 * UC Berkeley Sky Computing Lab lineage: the same group that built Apache Spark,
 * Ray.io, and vLLM. NexusFlow applies this infrastructure expertise to the #1
 * reliability challenge in agentic AI: accurate tool/function calling.
 *
 * Gorilla-OpenFunctions-v2: the first open-source 7B model to outperform GPT-4 on
 * function calling benchmarks. Berkeley Function Calling Leaderboard (BFCL) —
 * created by NexusFlow — is the definitive benchmark used by OpenAI, Anthropic,
 * and Google to measure their models' tool-use accuracy.
 *
 * OpenAI-compatible API at api.nexusflow.ai/v1. First purpose-built function-
 * calling LLM inference provider on LLMeter.
 *
 * Zero-dependency: uses duck-typing, no NexusFlow-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNexusFlow } from 'llmeter';
 *
 * const nexus = new OpenAI({
 *   apiKey: process.env.NEXUSFLOW_API_KEY,
 *   baseURL: 'https://api.nexusflow.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNexus = wrapNexusFlow(nexus, llmeter);
 *
 * // All calls through trackedNexus are automatically tracked
 * const completion = await trackedNexus.chat.completions.create(
 *   {
 *     model: 'gorilla-openfunctions-v2',
 *     messages: [{ role: 'user', content: 'Call the weather API for Berlin.' }],
 *     tools: [...],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNexusFlow<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NexusFlowCompletion>;
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
  ): Promise<NexusFlowCompletion> => {
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
