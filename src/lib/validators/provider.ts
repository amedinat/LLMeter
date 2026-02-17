import { z } from 'zod';

export const providerTypes = ['openai', 'anthropic', 'google', 'deepseek'] as const;

export const connectProviderSchema = z.object({
  provider: z.enum(providerTypes),
  apiKey: z.string().min(10, 'API key is too short'),
  displayName: z.string().max(100).optional(),
});

export type ConnectProviderInput = z.infer<typeof connectProviderSchema>;

export const updateProviderSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().max(100).optional(),
  apiKey: z.string().min(10).optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
