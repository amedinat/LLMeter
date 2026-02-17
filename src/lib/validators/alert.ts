import { z } from 'zod';

export const alertTypes = ['budget_limit', 'anomaly', 'daily_threshold'] as const;
export const alertPeriods = ['daily', 'monthly'] as const;

export const createAlertSchema = z.object({
  type: z.enum(alertTypes),
  config: z.object({
    threshold: z.number().positive('Threshold must be positive'),
    period: z.enum(alertPeriods),
    providers: z.array(z.string()).optional(),
  }),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const updateAlertSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
  config: createAlertSchema.shape.config.optional(),
});

export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
