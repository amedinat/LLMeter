import type { LLMeter } from './client.js';

/**
 * Minimal shape of a NAVER CLOVA Studio chat completion response.
 */
interface NaverCompletion {
  model?: string;
  result?: {
    message?: {
      role: string;
      content: string;
    };
    inputLength?: number;
    outputLength?: number;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a NAVER CLOVA Studio client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * NAVER is Korea's largest internet company (KRX: 035420, founded 1999).
 * HyperCLOVA X (2023) is their flagship bilingual Korean-English LLM —
 * the first non-English large language model to rival GPT-4 on Korean benchmarks.
 * HyperCLOVA (2021) was the world's first large Korean LLM at 82B parameters.
 * CLOVA Studio is the developer API platform serving 100M+ NAVER users.
 * HCX-DASH-003 $0.08/$0.24 per 1M — 97% cheaper than GPT-4o input.
 * clovastudio.stream.naver.com
 *
 * Credential format: `{apiKeyId}::{serviceKey}`
 * (obtain both from console.ncloud.com under AI Services > CLOVA Studio > API Keys)
 *
 * Zero-dependency: uses duck-typing; no NAVER-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapNaver } from 'llmeter';
 *
 * const naver = new OpenAI({
 *   apiKey: process.env.NAVER_SERVICE_KEY,
 *   baseURL: 'https://clovastudio.stream.naver.com/openai/v1',
 *   defaultHeaders: {
 *     'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_API_KEY_ID,
 *     'X-NCP-APIGW-API-KEY': process.env.NAVER_SERVICE_KEY,
 *   },
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedNaver = wrapNaver(naver, llmeter);
 *
 * // All calls through trackedNaver are automatically tracked
 * const completion = await trackedNaver.chat.completions.create(
 *   {
 *     model: 'HCX-003',
 *     messages: [{ role: 'user', content: 'Korea의 수도가 어디야?' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapNaver<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<NaverCompletion>;
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
  ): Promise<NaverCompletion> => {
    const customerId =
      (options?.llmeter_customer_id as string | undefined) ?? defaultCustomerId;
    const cleanOptions = options ? { ...options } : undefined;
    if (cleanOptions) delete cleanOptions['llmeter_customer_id'];

    const result = await originalCreate(
      params,
      Object.keys(cleanOptions ?? {}).length > 0 ? cleanOptions : undefined
    );

    const model = (result.model ?? (params.model as string | undefined) ?? 'HCX-003');

    if (result.usage) {
      tracker.track({
        model,
        inputTokens: result.usage.prompt_tokens,
        outputTokens: result.usage.completion_tokens,
        customerId,
      });
    } else if (result.result?.inputLength !== undefined && result.result?.outputLength !== undefined) {
      tracker.track({
        model,
        inputTokens: result.result.inputLength,
        outputTokens: result.result.outputLength,
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
