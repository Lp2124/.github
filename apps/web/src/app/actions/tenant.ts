'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { activeStoreCookie } from '@/lib/tenant/context';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/security/validation';

export async function switchStoreAction(formData: FormData) {
  const user = await requireUser();
  const parsedStoreId = uuidSchema.safeParse(formData.get('storeId'));

  if (!parsedStoreId.success) {
    redirect('/dashboard?error=invalid-store');
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('store_memberships')
    .select('store_id')
    .eq('user_id', user.id)
    .eq('store_id', parsedStoreId.data)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    redirect('/dashboard?error=unauthorized-store');
  }

  const cookieStore = await cookies();
  cookieStore.set(activeStoreCookie, parsedStoreId.data, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  });

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
