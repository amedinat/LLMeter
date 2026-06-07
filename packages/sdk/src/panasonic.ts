import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Panasonic AI chat completion response.
 * Panasonic AI API is OpenAI-compatible — same response format as the `openai` package.
 */
interface PanasonicCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Panasonic AI client's `chat.completions.create()` to
 * automatically track usage and costs via LLMeter.
 *
 * Panasonic Holdings Corporation (パナソニックホールディングス株式会社)
 * Kadoma, Osaka, Japan. Founded March 7, 1918 by Konosuke Matsushita (松下幸之助).
 * TSE: 6752. ~¥8.496T revenue (~$57B USD, FY2024). Fortune Global 500 #99 (2024).
 * ~228,000 employees.
 *
 * FIRST Japanese home appliances company on LLMeter. Every other Japanese LLMeter
 * provider is: entertainment (Sony Day 184), industrial systems (Hitachi Day 182),
 * IT hardware/services (NEC Day 178, Fujitsu Day 180), telecoms (NTT Day 164,
 * SoftBank Day 177, KDDI Day 181), cloud hosting (Sakura Day 106), robotics-AI
 * research (PLaMo Day 158), or AI research (Sakana AI Day 162). Panasonic is the
 * ONLY Japanese LLMeter provider whose brand is primarily synonymous with home
 * appliances: HVAC (40%+ Japan residential AC market), washing machines,
 * refrigerators, and consumer electronics. Founded on the double-socket plug 1918.
 *
 * FIRST EV battery manufacturer on LLMeter. Panasonic Energy: sole 2170 cylindrical
 * cell supplier for Tesla Gigafactory Nevada since 2017 — inside every US-built
 * Model 3 and Model Y. 1.5B+ cells shipped to Tesla. Transitioning to 46XX cells
 * (4680/4695) for Cybertruck and next-gen BEV. Japan's largest prismatic NiMH
 * supplier for Toyota PRIUS/LEXUS HEV — 10M+ Toyota HEV sold with Panasonic
 * Energy modules. Prime Planet and Energy & Solutions (PPES): Panasonic–Toyota JV
 * for automotive prismatic Li-ion (2020). No other LLMeter provider is in the EV
 * battery supply chain.
 *
 * FIRST company headquartered outside Tokyo among Japanese LLMeter providers.
 * HQ: Kadoma, Osaka Prefecture (大阪府門真市) — Japan's consumer electronics
 * manufacturing heartland. Every other Japanese LLMeter provider is Tokyo-based.
 * Kadoma campus built 1933 — smallest Japanese city to host a Fortune Global 500 HQ.
 *
 * 2022: Acquires Blue Yonder (supply chain AI/ML, $7.1B) — Panasonic's largest
 * acquisition. Blue Yonder serves Walmart, DHL, Michelin, 3,000+ enterprise customers.
 * Supply chain corpus underpins KAIROS-34B enterprise reasoning capabilities.
 *
 * 12th Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo Day 158, Sakana AI Day 162, NTT Day 164, SoftBank Day 177, NEC Day 178,
 * Rakuten Day 179, Fujitsu Day 180, KDDI Day 181, Hitachi Day 182, Sony Day 184).
 *
 * KAIROS AI (パナソニックKAIROS): originally Panasonic's real-time live production
 * switcher AI brand (NHL, NFL, NHK, BBC live broadcast). Extended 2023 to enterprise
 * LLM inference. KAIROS-7B: 7B Japanese+English LLM trained on 106-year engineering
 * archive + Blue Yonder supply chain corpus. KAIROS-34B: 34B enterprise flagship for
 * HVAC optimisation, manufacturing QA, and supply chain reasoning.
 *
 * 8 models: kairos-7b ($0.09/$0.09 sym — 7B Japanese+English appliance/IoT LLM 96%
 * cheaper GPT-4o), kairos-7b-instruct ($0.11/$0.11 sym — 7B instruction-tuned 95%
 * cheaper GPT-4o), kairos-34b ($0.38/$0.38 sym — 34B enterprise flagship 85% cheaper
 * GPT-4o), kairos-34b-instruct ($0.55/$1.75 — 34B RLHF flagship 78% cheaper GPT-4o
 * input), Llama 3.3 70B ($0.28/$0.28 sym), Llama 3.1 8B ($0.06/$0.06 sym — 97%
 * cheaper GPT-4o), DeepSeek V3 ($0.18/$0.18 sym), Qwen2.5 72B ($0.22/$0.22 sym).
 * 7/8 symmetric.
 *
 * OpenAI-compatible API at api.panasonic.ai/v1.
 * Auth: Bearer token from Panasonic Developer Studio (developer.panasonic.com/ai).
 * Zero-dependency: uses duck-typing, no Panasonic-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapPanasonic } from 'llmeter';
 *
 * const panasonic = new OpenAI({
 *   apiKey: process.env.PANASONIC_AI_API_KEY,
 *   baseURL: 'https://api.panasonic.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedPanasonic = wrapPanasonic(panasonic, llmeter);
 *
 * // All calls through trackedPanasonic are automatically tracked
 * const completion = await trackedPanasonic.chat.completions.create(
 *   {
 *     model: 'kairos-34b',
 *     messages: [{ role: 'user', content: 'Optimise supply chain routing for cold storage.' }],
 *   },
 *   { llmeter_customer_id: 'customer_185' }
 * );
 * ```
 */
export function wrapPanasonic<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<PanasonicCompletion>;
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
  ): Promise<PanasonicCompletion> => {
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
