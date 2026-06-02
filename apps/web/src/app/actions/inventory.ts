'use server';

import { revalidatePath } from 'next/cache';
import { writeAuditLog } from '@/lib/audit/log';
import { canManageCatalog, isOwnerOrAdmin } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { inventoryAdjustmentSchema } from '@/lib/operations/schemas';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type InventoryActionState = { error?: string; success?: string };

export async function createInventoryAdjustmentAction(_state: InventoryActionState, formData: FormData): Promise<InventoryActionState> {
  await assertSameOriginRequest();
  try {
    const user = await requireUser();
    const tenant = await requireTenantContext(user.id);
    if (!canManageCatalog(tenant.membership.role)) return { error: 'No tienes permisos para ajustar inventario.' };
    const parsed = inventoryAdjustmentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ajuste inválido.' };
    const supabase = await createClient();
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, current_stock')
      .eq('id', parsed.data.product_id)
      .eq('store_id', tenant.store.id)
      .maybeSingle();
    if (productError || !product) return { error: 'El producto no existe en la tienda activa.' };
    const nextStock = Number(product.current_stock) + parsed.data.quantity_delta;
    if (nextStock < 0 && (!isOwnerOrAdmin(tenant.membership.role) || parsed.data.reason.length < 12)) {
      return { error: 'El stock negativo requiere owner/admin y una razón detallada.' };
    }
    const { error: movementError } = await supabase.from('inventory_movements').insert({
      store_id: tenant.store.id,
      product_id: product.id,
      actor_id: user.id,
      movement_type: parsed.data.movement_type,
      quantity_delta: parsed.data.quantity_delta,
      stock_after: nextStock,
      reason: parsed.data.reason,
      reference: parsed.data.reference,
    });
    if (movementError) return { error: 'No fue posible registrar el movimiento.' };
    const { error: stockError } = await supabase.from('products').update({ current_stock: nextStock, updated_at: new Date().toISOString() }).eq('id', product.id).eq('store_id', tenant.store.id);
    if (stockError) return { error: 'No fue posible actualizar el stock.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'inventory.adjustment.create', entityType: 'products', entityId: product.id, metadata: { quantityDelta: parsed.data.quantity_delta, nextStock } });
    revalidatePath('/inventory');
    revalidatePath('/inventory/adjustments');
    revalidatePath(`/products/${product.id}`);
    return { success: 'Ajuste registrado.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}
