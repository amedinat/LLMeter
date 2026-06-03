import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Heroku Managed Inference chat completion response.
 * Heroku Managed Inference is OpenAI-compatible — same response format as the `openai` package.
 */
interface HerokuCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Heroku Managed Inference client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Heroku (heroku.com) — San Francisco, CA. Founded 2007 by Adam Wiggins, James Lindenbaum,
 * and Orion Henry. Acquired by Salesforce for $212M in December 2010.
 *
 * THE FIRST PaaS (Platform as a Service) pioneer to offer native LLM inference on LLMeter.
 * Every other LLMeter provider started as an AI company, GPU startup, or cloud provider.
 * Heroku uniquely bridges the 2007 developer cloud era with the 2024 AI era.
 *
 * Heroku invented the PaaS category: `git push heroku main` → app deployed, no servers.
 * Heroku Buildpacks (now the standard for Cloud Foundry, Dokku, Render, Railway, Fly.io),
 * Heroku Dynos (the original "serverless compute" before Lambda/Kubernetes), and the
 * Add-ons marketplace (the model every dev-tools ecosystem clones today).
 *
 * Heroku Managed Inference (2024): `heroku addons:create heroku-inference` → your app
 * has LLM superpowers. OpenAI-compatible API at us.inference.heroku.com/v1.
 * Anthropic Claude, Meta Llama, and Cohere models available.
 * US (us.inference.heroku.com) and EU (eu.inference.heroku.com) regions.
 *
 * OpenAI-compatible API. Zero-dependency: uses duck-typing,
 * no Heroku-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapHeroku } from 'llmeter';
 *
 * const heroku = new OpenAI({
 *   apiKey: process.env.HEROKU_API_KEY,
 *   baseURL: 'https://us.inference.heroku.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedHeroku = wrapHeroku(heroku, llmeter);
 *
 * // All calls through trackedHeroku are automatically tracked
 * const completion = await trackedHeroku.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from Heroku Managed Inference!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapHeroku<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<HerokuCompletion>;
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
  ): Promise<HerokuCompletion> => {
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
