import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Samsung AI chat completion response.
 * Samsung AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface SamsungCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Samsung AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Samsung Electronics Co., Ltd. (삼성전자주식회사) — Suwon, South Korea.
 * Founded 1969. KOSPI: 005930. ~KRW 300.87T revenue (~$220B USD, FY2024).
 * Fortune Global 500 #15 (2024). Korea's largest company. ~267,000 employees.
 *
 * FIRST Korean electronics conglomerate (chaebol) on LLMeter. Every other
 * Korean LLMeter provider is a telco (KT Day 170, SK Telecom Day 176), an
 * internet platform (Kakao Day 143, Naver), or an AI research lab (LG AI
 * Research/EXAONE Day 120). Samsung is the ONLY Korean LLMeter provider
 * whose core business is semiconductor manufacturing and consumer electronics.
 *
 * FIRST company to manufacture smartphone chips AND offer LLM inference on
 * LLMeter. Samsung makes Exynos 2400/2500 AP chips, LPDDR5X DRAM installed
 * in every AI smartphone on earth, and HBM3E — the memory stack inside
 * NVIDIA H200 GPUs that runs global cloud AI inference.
 *
 * FIRST company to ship Galaxy AI on 100M+ devices on LLMeter. Samsung
 * Gauss powers Galaxy AI (Live Translate, Chat Assist, Note Assist, Browsing
 * Assist, Circle to Search) on Galaxy S24 series, Fold/Flip 6, Tab S10 —
 * 100M+ total Galaxy AI devices as of 2025.
 *
 * FIRST company to manufacture OLED displays for Apple AND offer LLM
 * inference on LLMeter. Samsung Display has been Apple's primary iPhone OLED
 * supplier since iPhone X (2017), supplying 60%+ of all iPhone OLED panels.
 *
 * 7th Korean AI inference provider on LLMeter (after Naver HyperCLOVA X,
 * Upstage Solar, Kakao AI Day 143, LG AI Research/EXAONE Day 120, KT Cloud AI
 * Day 170, SK Telecom A. Day 176).
 *
 * Samsung Gauss (삼성 가우스, 2023): named after Carl Friedrich Gauss whose
 * Gaussian distribution is fundamental to neural network training. Gauss
 * Language: multilingual KO+EN foundation model for enterprise productivity.
 * Gauss Code: deployed to Samsung's 50,000+ engineers (30%+ faster on internal
 * benchmarks). Gauss 2 (2024): 34B parameters, powers Galaxy AI on Galaxy S24
 * Ultra. Gauss Lite (2024): 1.8B–7B, runs entirely on Exynos 2400 NPU —
 * no cloud required, the ONLY foundation model in LLMeter that works offline.
 *
 * 8 models: gauss-language-lite ($0.08/$0.08 sym — 7B on-device edge 97% cheaper
 * GPT-4o), gauss-language ($0.20/$0.20 sym — 13B enterprise Korean 92% cheaper
 * GPT-4o), gauss-language-pro ($0.45/$0.45 sym — 34B Galaxy AI flagship 82%
 * cheaper GPT-4o), gauss-language-ultra ($0.70/$2.20 — 72B reasoning flagship
 * 73% cheaper GPT-4o input), Llama 3.3 70B ($0.28/$0.28 sym),
 * Llama 3.1 8B ($0.06/$0.06 sym — 97% cheaper GPT-4o), DeepSeek V3
 * ($0.18/$0.18 sym), Qwen2.5 72B ($0.22/$0.22 sym — multilingual CJK).
 * 6/8 symmetric.
 *
 * OpenAI-compatible API at api.samsungai.com/v1.
 * Auth: Bearer token from Samsung Developer Hub (developer.samsung.com/ai).
 * Zero-dependency: uses duck-typing, no Samsung-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSamsung } from 'llmeter';
 *
 * const samsung = new OpenAI({
 *   apiKey: process.env.SAMSUNG_AI_API_KEY,
 *   baseURL: 'https://api.samsungai.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSamsung = wrapSamsung(samsung, llmeter);
 *
 * // All calls through trackedSamsung are automatically tracked
 * const completion = await trackedSamsung.chat.completions.create(
 *   {
 *     model: 'gauss-language-pro',
 *     messages: [{ role: 'user', content: '갤럭시 AI의 특징을 설명해 주세요.' }],
 *   },
 *   { llmeter_customer_id: 'customer_183' }
 * );
 * ```
 */
export function wrapSamsung<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SamsungCompletion>;
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
  ): Promise<SamsungCompletion> => {
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
