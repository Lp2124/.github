import { AdjustmentForm } from '@/app/(app)/inventory/adjustment-form';
import { canManageCatalog } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function InventoryAdjustmentsPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canManageCatalog(tenant.membership.role)) return <p className="rounded-2xl border border-red-200 bg-white p-6 font-semibold text-red-700">No tienes permisos para ajustar inventario.</p>;
  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('id, sku, name, current_stock').eq('store_id', tenant.store.id).eq('is_active', true).order('name');
  return <section className="space-y-4"><h2 className="text-3xl font-bold">Registrar ajuste de inventario</h2>{products?.length ? <AdjustmentForm products={products} /> : <p className="rounded-2xl border bg-white p-6 text-slate-600">Primero registra productos activos para ajustar inventario.</p>}</section>;
}
