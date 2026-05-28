import { headers } from 'next/headers';
import { slugSchema } from './tenant-resolver';

export async function getCurrentTenantSlug(): Promise<string> {
  const headerStore = await headers();
  const slug = headerStore.get('x-tenant-slug');
  const parsed = slugSchema.safeParse(slug);

  if (!parsed.success) {
    throw new Error('Tenant slug missing or invalid in request context.');
  }

  return parsed.data;
}
