import { z } from 'zod';

/** Provider types that can be connected (have working adapters) */
export const providerTypes = ['openai', 'anthropic', 'google', 'deepseek', 'openrouter', 'mistral', 'azure', 'xai', 'cohere', 'groq', 'together', 'fireworks', 'perplexity', 'cerebras', 'ai21', 'deepinfra', 'novita', 'hyperbolic', 'sambanova', 'lambdalabs', 'lepton', 'inferencenet', 'nvidia', 'cloudflare', 'nebius', 'replicate', 'featherless', 'huggingface', 'yi', 'zhipu', 'upstage', 'moonshot', 'writer', 'qwen', 'minimax', 'doubao', 'hunyuan', 'baichuan', 'siliconflow', 'stepfun', 'baidu', 'kluster', 'friendli', 'llamaapi', 'reka', 'maritaca', 'scaleway', 'nscale', 'aimlapi', 'bedrock', 'alephalpha', 'sarvam', 'chutes', 'krutrim', 'digitalocean', 'ovhcloud', 'telnyx', 'vultr', 'ai71', 'gcore', 'crusoe', 'databricks', 'gradient', 'baseten', 'watsonx', 'snowflake', 'neets', 'runpod', 'predibase', 'vertexai', 'spark', 'ionet', 'oci', 'gigachat', 'github', 'parasail', 'openpipe', 'corcel', 'inception', 'liquid', 'zyphra', 'akash', 'arcee', 'centml', 'venice', 'inferless', 'codestral', 'fluidstack', 'monsterapi', 'coreweave', 'prem', 'clarifai', 'sensenova', 'ai360', 'naver', 'inflection', 'yandex', 'fal', 'ionos', 'anyscale', 'nousresearch', 'meta', 'glhf', 'sakura', 'textsynth', 'heurist', 'nearai', 'netmind', 'hyperstack', 'gmi', 'internlm', 'targon', 'skywork', 'infermatic', 'mancer', 'rhymes', 'primeintellect', 'exaone', 'mimo', 'lamini', 'intel', 'h2o', 'g42', 'tensorwave', 'recursal', 'voyage', 'nomic', 'jina', 'tenstorrent', 'mixedbread', 'stability', 'octoai', 'ai2', 'lighton', 'modular'] as const;

/** All known provider types (same as providerTypes — no more coming-soon) */
export const allProviderTypes = providerTypes;

/** Providers that are not yet available for connection */
export const comingSoonProviders: readonly string[] = [];

/** Providers that require a Pro (or higher) plan */
export const premiumProviders = ['openrouter'] as const;

export const connectProviderSchema = z.object({
  provider: z.enum(providerTypes, { errorMap: () => ({ message: 'Please select a provider' }) }),
  apiKey: z.string().trim().min(10, 'API key is too short').max(500, 'API key is too long'),
  displayName: z.string().trim().max(100).optional(),
});

export type ConnectProviderInput = z.infer<typeof connectProviderSchema>;

export const updateProviderSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().max(100).optional(),
  apiKey: z.string().trim().min(10).max(500).optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
