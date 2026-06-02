import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Kakao AI chat completion response.
 * Kakao AI uses an OpenAI-compatible API format.
 */
interface KakaoCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Kakao AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Kakao Corp (카카오, KOSPI: 035720) — Jeju-si, Jeju-do, South Korea.
 * Founded 2010 by Brian Kim (Kim Beom-su). KakaoTalk: 53M monthly active
 * users, 96% of South Korea's population — the de facto communication
 * infrastructure of an entire nation.
 *
 * KoGPT — first open-source Korean GPT-3 scale model (June 2021):
 * 6B parameters trained on 200B+ Korean tokens. Apache 2.0 licensed.
 * KoGPT 2.0 (2023): 30B parameter upgrade. Fourth Korean AI provider on
 * LLMeter after NAVER HyperCLOVA X (Day 97), Upstage Solar, and EXAONE
 * / LG AI Research (Day 120).
 *
 * Zero-dependency: uses duck-typing, no Kakao-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapKakao } from 'llmeter';
 *
 * const kakao = new OpenAI({
 *   apiKey: process.env.KAKAO_API_KEY,
 *   baseURL: 'https://api.kakao.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedKakao = wrapKakao(kakao, llmeter);
 *
 * // All calls through trackedKakao are automatically tracked
 * const completion = await trackedKakao.chat.completions.create(
 *   {
 *     model: 'kogpt-2.0-30b-chat',
 *     messages: [{ role: 'user', content: '안녕하세요! 한국어로 AI를 설명해 주세요.' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapKakao<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<KakaoCompletion>;
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
  ): Promise<KakaoCompletion> => {
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
