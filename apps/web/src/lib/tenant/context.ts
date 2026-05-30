import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

export type Store = Database['public']['Tables']['stores']['Row'];
export type StoreMembership = Database['public']['Tables']['store_memberships']['Row'];

const activeStoreCookie = 'liora_active_store_id';
const uuidSchema = z.string().uuid();

export async function getTenantContext(userId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const cookieStoreId = cookieStore.get(activeStoreCookie)?.value;

  const { data: memberships, error } = await supabase
    .from('store_memberships')
    .select('*, stores(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Unable to load store memberships: ${error.message}`);
  if (!memberships || memberships.length === 0) return null;

  const requestedStoreId = uuidSchema.safeParse(cookieStoreId).success ? cookieStoreId : null;
  const selected = memberships.find((membership) => membership.store_id === requestedStoreId) ?? memberships[0];
  const store = selected.stores as Store | null;

  if (!store || !store.is_active) return null;

  return {
    store,
    membership: selected as StoreMembership,
    memberships: memberships.map((membership) => ({
      membership: membership as StoreMembership,
      store: membership.stores as Store,
    })),
  };
}

export async function requireTenantContext(userId: string) {
  const context = await getTenantContext(userId);
  if (!context) redirect('/login?error=no-store');
  return context;
}

export { activeStoreCookie };
