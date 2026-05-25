import type { LLMeter } from './client.js';

/**
 * Minimal shape of a GitHub Models chat completion response.
 * GitHub Models is OpenAI-compatible — same response format as the `openai` package
 * when using the GitHub Models Azure AI Foundry inference endpoint.
 */
interface GitHubCompletion {
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Wraps a GitHub Models client's `chat.completions.create()` to automatically
 * track usage and costs via LLMeter.
 *
 * GitHub Models is OpenAI-compatible — use the `openai` npm package with the
 * GitHub Models base URL and your GitHub Personal Access Token as the API key.
 * Zero-dependency: uses duck-typing, no GitHub-specific SDK import required.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import LLMeter, { wrapGitHub } from 'llmeter';
 *
 * const github = new OpenAI({
 *   apiKey: process.env.GITHUB_TOKEN,  // GitHub Personal Access Token
 *   baseURL: 'https://models.inference.ai.azure.com',
 * });
 * const llmeter = new LLMeter({ apiKey: 'lm_...' });
 * const trackedGitHub = wrapGitHub(github, llmeter);
 *
 * // All calls through trackedGitHub are automatically tracked
 * const completion = await trackedGitHub.chat.completions.create(
 *   {
 *     model: 'gpt-4o',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   },
 *   { llmeter_customer_id: 'user_abc123' }
 * );
 * ```
 */
export function wrapGitHub<
  T extends {
    chat: {
      completions: {
        create: (...args: unknown[]) => Promise<GitHubCompletion>;
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
  ): Promise<GitHubCompletion> => {
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
