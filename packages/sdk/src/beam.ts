import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Beam chat completion response.
 * Beam is OpenAI-compatible — same response format as the `openai` package.
 */
interface BeamCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Beam client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Beam (beam.cloud) — Boston, MA / Remote. Founded 2021.
 *
 * FIRST Python-native serverless ML-first GPU inference platform on LLMeter.
 *
 * Founded by Stephen Hays (CEO) and Chris Tsang (CTO). Built from day one
 * for ML engineers: @beam.endpoint() Python decorators, no Dockerfile
 * required, no Kubernetes knowledge needed. Pre-caches container images
 * and model weights for cold starts under 2 seconds on A10G GPUs.
 * $20M raised from Benchmark, Felicis Ventures, and Y Combinator (YC W21).
 *
 * 8 models: llama-3.3-70b-instruct ($0.32/$0.55 — flagship, 87%
 * cheaper GPT-4o), llama-3.1-70b-instruct ($0.28/$0.45), llama-3.1-8b-
 * instruct ($0.06/$0.06 sym — budget, 97% cheaper GPT-4o), mistral-7b-
 * instruct ($0.05/$0.05 sym — cheapest, 98% cheaper GPT-4o), deepseek-r1
 * ($0.50/$2.00 — reasoning), qwen2.5-72b-instruct ($0.28/$0.28 sym —
 * multilingual), gemma-2-9b-it ($0.06/$0.06 sym), phi-4 ($0.10/$0.10
 * sym — Microsoft SLM). 5/8 symmetric.
 *
 * OpenAI-compatible API at api.beam.cloud/v1.
 * Auth: Bearer token from Beam dashboard (beam.cloud/dashboard/settings).
 * Zero-dependency: uses duck-typing, no Beam-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapBeam } from 'llmeter';
 *
 * const beam = new OpenAI({
 *   apiKey: process.env.BEAM_API_KEY,
 *   baseURL: 'https://api.beam.cloud/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedBeam = wrapBeam(beam, llmeter);
 *
 * // All calls through trackedBeam are automatically tracked
 * const completion = await trackedBeam.chat.completions.create(
 *   {
 *     model: 'llama-3.3-70b-instruct',
 *     messages: [{ role: 'user', content: 'Hello from Boston!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapBeam<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<BeamCompletion>;
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
  ): Promise<BeamCompletion> => {
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
