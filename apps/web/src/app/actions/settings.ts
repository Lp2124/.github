'use server';

import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { hasRoleAtLeast } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';
import { storeSettingsFormSchema } from '@/lib/tenant/settings';

export type SettingsActionState = { error?: string; success?: string };

export async function updateStoreSettingsAction(_state: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!hasRoleAtLeast(tenant.membership.role, 'admin')) {
    return { error: 'No tienes permisos para modificar la configuración global.' };
  }

  const parsed = storeSettingsFormSchema.safeParse({
    name: formData.get('name'),
    timezone: formData.get('timezone'),
    currency: formData.get('currency'),
  });

  if (!parsed.success) {
    return { error: 'La configuración enviada no es válida.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('stores')
    .update({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenant.store.id);

  if (error) {
    return { error: `No fue posible guardar la configuración: ${error.message}` };
  }

  await writeAuditLog({
    storeId: tenant.store.id,
    actorId: user.id,
    action: 'store.settings.update',
    entityType: 'stores',
    entityId: tenant.store.id,
    metadata: {
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
    },
  });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: 'Configuración global actualizada.' };
}
