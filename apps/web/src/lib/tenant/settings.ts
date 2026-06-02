import { z } from 'zod';

export const storeSettingsFormSchema = z.object({
  name: z.string().trim().min(2).max(140),
  timezone: z.string().trim().min(3).max(80).regex(/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
});

export type StoreSettingsForm = z.infer<typeof storeSettingsFormSchema>;
