import { z } from 'zod';

/** Provider types that can be connected (have working usage APIs) */
export const providerTypes = ['openai', 'anthropic', 'deepseek', 'openrouter'] as const;

/** All known provider types including coming-soon ones */
export const allProviderTypes = ['openai', 'anthropic', 'google', 'deepseek', 'openrouter'] as const;

/** Providers that are not yet available for connection */
export const comingSoonProviders = ['google'] as const;

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
