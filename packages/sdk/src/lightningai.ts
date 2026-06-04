import type { LLMeter } from './client.js';

/**
 * Minimal shape of a Lightning AI chat completion response.
 * Lightning AI is OpenAI-compatible — same response format as the `openai` package.
 */
interface LightningAICompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a Lightning AI client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * Lightning AI — San Francisco, CA + NYC. Founded 2019.
 * Founders: William Falcon (CEO) + Luca Antiga (CTO).
 *
 * FIRST open-source ML framework creator to offer commercial AI inference on LLMeter.
 * FIRST PyTorch-native inference platform on LLMeter.
 *
 * William Falcon created PyTorch Lightning in 2019 while a PhD student at NYU —
 * the framework that abstracted away PyTorch boilerplate (distributed training,
 * mixed precision, gradient accumulation) into a clean interface. 27,000+ GitHub
 * stars, 5M+ PyPI downloads/month, adopted by Apple, Meta, Google, Goldman Sachs,
 * NASA. Donated to the Linux Foundation as a foundation-level project in 2022.
 *
 * Luca Antiga co-created the PyTorch DataLoader — the data loading subsystem
 * that every ML practitioner uses daily — bringing deep PyTorch optimization
 * knowledge to Lightning AI's inference serving infrastructure.
 *
 * $58M raised from Coatue Management, Bain Capital Ventures, Index Ventures,
 * NVIDIA, and First Round Capital. Lightning AI Studio: cloud GPU IDE + serverless
 * inference on H100 clusters via Lit-LLM (Apache 2.0 open-source inference stack).
 *
 * 8 models: meta-llama/Llama-3.3-70B-Instruct ($0.25/$0.40 — PyTorch-native
 * flagship, 90% cheaper GPT-4o), meta-llama/Llama-3.1-70B-Instruct ($0.22/$0.32),
 * meta-llama/Llama-3.1-8B-Instruct ($0.05/$0.05 sym — budget, 98% cheaper GPT-4o),
 * mistralai/Mistral-7B-Instruct-v0.3 ($0.04/$0.04 sym — cheapest, 98% cheaper),
 * deepseek-ai/DeepSeek-R1 ($0.50/$2.00 — reasoning), Qwen/Qwen2.5-72B-Instruct
 * ($0.25/$0.25 sym — multilingual), google/Gemma-2-9B-IT ($0.05/$0.05 sym —
 * Google open-source), microsoft/Phi-4 ($0.10/$0.10 sym — Microsoft SLM). 5/8 sym.
 *
 * OpenAI-compatible API at api.lightning.ai/v1.
 * Auth: Bearer token from lightning.ai account. Zero-dependency: uses duck-typing,
 * no Lightning AI-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapLightningAI } from 'llmeter';
 *
 * const lightning = new OpenAI({
 *   apiKey: process.env.LIGHTNING_AI_API_KEY,
 *   baseURL: 'https://api.lightning.ai/v1',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedLightning = wrapLightningAI(lightning, llmeter);
 *
 * // All calls through trackedLightning are automatically tracked
 * const completion = await trackedLightning.chat.completions.create(
 *   {
 *     model: 'meta-llama/Llama-3.3-70B-Instruct',
 *     messages: [{ role: 'user', content: 'Hello from PyTorch Lightning!' }],
 *   },
 *   { llmeter_customer_id: 'customer_123' }
 * );
 * ```
 */
export function wrapLightningAI<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<LightningAICompletion>;
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
  ): Promise<LightningAICompletion> => {
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
