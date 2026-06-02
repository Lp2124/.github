'use server';

import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { canApplySaleDiscount, canOperatePos } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { completeSaleSchema, parseJsonFormField } from '@/lib/operations/schemas';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type SaleActionState = { error?: string; success?: string };

export async function completeSaleAction(_state: SaleActionState, formData: FormData): Promise<SaleActionState> {
  await assertSameOriginRequest();
  try {
    const user = await requireUser();
    const tenant = await requireTenantContext(user.id);
    if (!canOperatePos(tenant.membership.role)) return { error: 'No tienes permisos para operar POS.' };
    const parsed = parseJsonFormField(formData.get('payload'), completeSaleSchema);
    if (!parsed.success) return { error: 'Venta inválida.' };
    if (parsed.data.discount_amount > 0 && !canApplySaleDiscount(tenant.membership.role)) {
      return { error: 'Solo manager/admin/owner pueden aplicar descuentos.' };
    }
    const supabase = await createClient();
    const { data: session } = await supabase
      .from('cash_register_sessions')
      .select('id')
      .eq('store_id', tenant.store.id)
      .eq('status', 'open')
      .maybeSingle();
    if (!session) return { error: 'Debes abrir caja antes de completar ventas.' };
    const { data, error } = await supabase.rpc('complete_pos_sale', {
      p_store_id: tenant.store.id,
      p_actor_id: user.id,
      p_cash_session_id: session.id,
      p_customer_id: parsed.data.customer_id,
      p_discount_amount: parsed.data.discount_amount,
      p_items: parsed.data.items,
    });
    if (error || !data) return { error: 'No fue posible completar la venta. Verifica stock y productos activos.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'sale.complete', entityType: 'sales', entityId: data, metadata: { itemCount: parsed.data.items.length } });
    revalidatePath('/pos');
    revalidatePath('/inventory');
    revalidatePath('/reports');
    revalidatePath('/cash');
    return { success: `Venta completada: ${data}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}
