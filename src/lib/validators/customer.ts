import { z } from 'zod';

export const updateCustomerSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(200, 'Display name must be 200 characters or fewer'),
  metadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
