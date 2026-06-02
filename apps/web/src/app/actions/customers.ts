'use server';

import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { canOperatePos } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { customerSchema } from '@/lib/operations/schemas';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type CustomerActionState = { error?: string; success?: string };

export async function createCustomerAction(_state: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  await assertSameOriginRequest();
  try {
    const user = await requireUser();
    const tenant = await requireTenantContext(user.id);
    if (!canOperatePos(tenant.membership.role)) return { error: 'No tienes permisos para registrar clientes.' };
    const parsed = customerSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Cliente inválido.' };
    const supabase = await createClient();
    const { data, error } = await supabase.from('customers').insert({ ...parsed.data, store_id: tenant.store.id }).select('id').single();
    if (error) return { error: 'No fue posible crear el cliente.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'customer.create', entityType: 'customers', entityId: data.id, metadata: { name: parsed.data.name } });
    revalidatePath('/customers');
    return { success: 'Cliente registrado.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}
