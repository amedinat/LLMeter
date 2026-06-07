import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Sony AI chat completion response.
 * Sony AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface SonyCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Sony AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Sony Group Corporation (ソニーグループ株式会社) — Minato, Tokyo, Japan.
 * Founded May 7, 1946 by Masaru Ibuka + Akio Morita. TSE: 6758. NYSE: SONY.
 * ~¥13.02T revenue (~$87B USD, FY2024). Fortune Global 500 #76 (2024).
 * ~110,000 employees.
 *
 * FIRST Japanese entertainment company on LLMeter. Every other Japanese
 * LLMeter provider is a telco (NTT Day 164, SoftBank Day 177, KDDI Day 181),
 * IT hardware/services (Hitachi Day 182, Fujitsu Day 180, NEC Day 178), cloud
 * host (Sakura Day 106), robotics-AI lab (PLaMo Day 158), or pure research org
 * (Sakana AI Day 162). Sony's primary revenue is entertainment: PlayStation
 * gaming (~34% of group revenue), Sony Music Entertainment (#2 global music
 * label), Sony Pictures Entertainment (Columbia Pictures, TriStar, Crunchyroll).
 *
 * FIRST company to defeat world champions in a racing simulator AND offer LLM
 * inference on LLMeter. Gran Turismo Sophy: Sony AI's RL agent beat the world's
 * four best Gran Turismo 7 drivers at the GT World Series Final 2022. Published
 * in Nature (vol 602, February 2022). First AI to beat humans at a
 * professional-level motorsport simulation game.
 *
 * FIRST company to manufacture CMOS image sensors for smartphones AND offer LLM
 * inference on LLMeter. Sony Semiconductor Solutions: ~50% global market share
 * of smartphone CMOS sensors (2024). Inside iPhone 15 Pro (IMX903), Samsung
 * Galaxy S24 Ultra (IMX884), Tesla FSD autopilot cameras (ISX031).
 *
 * FIRST company to simultaneously own a major Hollywood film studio, a major
 * global music label, AND offer LLM inference on LLMeter. Sony Pictures
 * (Columbia/TriStar/Crunchyroll) + Sony Music (Beyoncé, Adele, BTS/HYBE
 * partnership, Bad Bunny) + PlayStation game publishing.
 *
 * 11th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo Day 158, Sakana AI Day 162, NTT Group Day 164, SoftBank Day 177,
 * NEC Day 178, Rakuten AI Day 179, Fujitsu Day 180, KDDI Day 181, Hitachi Day 182).
 *
 * Sony AI (2019): Gran Turismo Sophy, Dreamer V3 world-model RL, Sony Foundation
 * Model (SFM) enterprise Japanese+English LLM. CEO: Hiroaki Kitano.
 *
 * 8 models: sony-foundation-7b ($0.09/$0.09 sym — 7B Japanese+English 96% cheaper
 * GPT-4o), sony-foundation-70b ($0.32/$0.32 sym — 70B enterprise 87% cheaper),
 * sony-creative-7b ($0.10/$0.10 sym — 7B creative/entertainment AI 96% cheaper),
 * sony-creative-70b ($0.42/$1.35 — 70B multimodal creative 84% cheaper input),
 * Llama 3.3 70B ($0.28/$0.28 sym), Llama 3.1 8B ($0.06/$0.06 sym — 97% cheaper
 * GPT-4o), DeepSeek V3 ($0.18/$0.18 sym), Qwen2.5 72B ($0.22/$0.22 sym). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.ai.sony.com/v1.
 * Auth: Bearer token from Sony Developer Platform (developer.sony.com/develop/ai).
 * Zero-dependency: uses duck-typing, no Sony-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSony } from 'llmeter';
 *
 * const sony = new OpenAI({
 *   apiKey: process.env.SONY_AI_API_KEY,
 *   baseURL: 'https://api.ai.sony.com/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSony = wrapSony(sony, llmeter);
 *
 * // All calls through trackedSony are automatically tracked
 * const completion = await trackedSony.chat.completions.create(
 *   {
 *     model: 'sony-foundation-70b',
 *     messages: [{ role: 'user', content: 'Explain PlayStation 5 architecture.' }],
 *   },
 *   { llmeter_customer_id: 'customer_184' }
 * );
 * ```
 */
export function wrapSony<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SonyCompletion>;
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
  ): Promise<SonyCompletion> => {
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
