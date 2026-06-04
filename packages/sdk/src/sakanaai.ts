import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Sakana AI chat completion response.
 * Sakana AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface SakanaAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Sakana AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Sakana AI — Tokyo, Japan. Founded 2023.
 *
 * FIRST evolutionary AI company on LLMeter.
 * THIRD Japanese AI inference provider on LLMeter (after Sakura Internet Day 106,
 * PLaMo/Preferred Networks Day 158).
 *
 * Founded by Llion Jones (CTO, co-author of "Attention Is All You Need" — the
 * 2017 Transformer paper with 110,000+ citations that underpins every major LLM)
 * and David Ha (CEO, former Head of Google Brain Tokyo and Research Director at
 * Google DeepMind). The name "Sakana" (魚, fish) is a deliberate homage to the
 * emergent collective intelligence of fish schools — complex behavior arising from
 * simple local rules — as the guiding metaphor for nature-inspired AI.
 *
 * Sakana AI builds AI through evolutionary and nature-inspired algorithms:
 * Evolutionary Model Merging discovers optimal ways to combine existing model
 * checkpoints without training from scratch. EvoLLM-JP and EvoVLM-JP are
 * Japanese LLM/VLM models created via evolutionary merging — outperforming
 * conventionally trained models on Japanese benchmarks at a fraction of the
 * compute cost. The AI Scientist (2024) is an autonomous AI research agent
 * that generates hypotheses, runs experiments, and writes papers.
 *
 * 8 models: EvoLLM-JP-v1-7B ($0.10/$0.10 sym — Japanese evolutionary flagship,
 * 96% cheaper GPT-4o), EvoLLM-JP-A-v1-7B ($0.12/$0.12 sym — enhanced Japanese,
 * 95% cheaper GPT-4o), EvoVLM-JP-v1-7B ($0.15/$0.15 sym — Japanese vision-language),
 * Llama-3.3-70B-Instruct ($0.25/$0.40 — general flagship, 90% cheaper GPT-4o),
 * Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget, 98% cheaper GPT-4o),
 * Mistral-7B-Instruct ($0.04/$0.04 sym — cheapest, 98% cheaper GPT-4o),
 * DeepSeek-R1 ($0.50/$2.00 — reasoning), Qwen2.5-72B-Instruct ($0.20/$0.20 sym
 * — multilingual). 6/8 symmetric.
 *
 * OpenAI-compatible API at api.sakana.ai/v1.
 * Auth: Bearer token from sakana.ai account. Zero-dependency: uses duck-typing,
 * no Sakana AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapSakanaAI } from 'llmeter';
 *
 * const sakana = new OpenAI({
 *   apiKey: process.env.SAKANAAI_API_KEY,
 *   baseURL: 'https://api.sakana.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedSakana = wrapSakanaAI(sakana, llmeter);
 *
 * // All calls through trackedSakana are automatically tracked
 * const completion = await trackedSakana.chat.completions.create(
 *   {
 *     model: 'EvoLLM-JP-v1-7B',
 *     messages: [{ role: 'user', content: '日本語でお願いします。' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapSakanaAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<SakanaAICompletion>;
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
  ): Promise<SakanaAICompletion> => {
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
