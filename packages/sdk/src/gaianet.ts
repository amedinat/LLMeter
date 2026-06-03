import type { LLMeter } from './client.js';

/**
 * Minimal shape of a GaiaNet chat completion response.
 * GaiaNet is OpenAI-compatible — same response format as the `openai` package.
 */
interface GaiaNetCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a GaiaNet client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * GaiaNet (gaianet.ai) — San Francisco / Singapore. Founded 2023.
 *
 * FIRST WebAssembly-based decentralized AI inference network on LLMeter.
 * 8th decentralized AI compute network on LLMeter (after io.net, Akash,
 * Corcel/Bittensor, Heurist, NEAR AI, Targon/Nineteen.ai, Prime Intellect).
 *
 * Founded by Michael Yuan (CEO, co-creator of WasmEdge — the CNCF WebAssembly
 * runtime). Each GaiaNet node runs AI models via WasmEdge sandboxing, providing
 * portable, secure inference on any hardware from edge devices to GPU clusters.
 * Node operators customize their node with a domain-specific knowledge base
 * (RAG) and system prompt, creating specialist AI agents (legal, medical,
 * educational, coding) that anyone can deploy in 10 minutes.
 *
 * OpenAI-compatible API at api.gaianet.ai/v1. Zero-dependency: uses
 * duck-typing, no GaiaNet-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapGaiaNet } from 'llmeter';
 *
 * const gaianet = new OpenAI({
 *   apiKey: process.env.GAIANET_API_KEY,
 *   baseURL: 'https://api.gaianet.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGaiaNet = wrapGaiaNet(gaianet, llmeter);
 *
 * // All calls through trackedGaiaNet are automatically tracked
 * const completion = await trackedGaiaNet.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Explain WebAssembly for AI.' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapGaiaNet<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GaiaNetCompletion>;
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
  ): Promise<GaiaNetCompletion> => {
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
