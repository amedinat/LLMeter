import { z } from 'zod';

/** Provider types that can be connected (have working adapters) */
export const providerTypes = ['openai', 'anthropic', 'google', 'deepseek', 'openrouter', 'mistral', 'azure', 'xai', 'cohere', 'groq', 'together', 'fireworks', 'perplexity', 'cerebras', 'ai21', 'deepinfra', 'novita', 'hyperbolic', 'sambanova', 'lambdalabs', 'lepton', 'inferencenet', 'nvidia', 'cloudflare', 'nebius', 'replicate', 'featherless', 'huggingface', 'yi', 'zhipu', 'upstage', 'moonshot', 'writer', 'qwen', 'minimax', 'doubao', 'hunyuan', 'baichuan', 'siliconflow', 'stepfun', 'baidu', 'kluster', 'friendli', 'llamaapi', 'reka', 'maritaca', 'scaleway', 'nscale', 'aimlapi', 'bedrock', 'alephalpha', 'sarvam'] as const;

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
