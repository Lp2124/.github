import { z } from 'zod';

export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export function extractTenantSlug(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return null;

  const parsed = slugSchema.safeParse(segment.toLowerCase());
  if (!parsed.success) return null;

  return parsed.data;
}
