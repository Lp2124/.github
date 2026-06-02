import { PosTerminal } from '@/app/(app)/pos/pos-terminal';
import { canOperatePos } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function PosPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canOperatePos(tenant.membership.role)) return <p className="rounded-2xl border border-red-200 bg-white p-6 font-semibold text-red-700">No tienes permisos para operar POS.</p>;
  const supabase = await createClient();
  const [{ data: products }, { data: customers }, { data: session }] = await Promise.all([
    supabase.from('products').select('id, sku, barcode, name, sale_price, current_stock, is_active').eq('store_id', tenant.store.id).eq('is_active', true).gt('current_stock', 0).order('name').limit(200),
    supabase.from('customers').select('id, name').eq('store_id', tenant.store.id).eq('is_active', true).order('name').limit(200),
    supabase.from('cash_register_sessions').select('id').eq('store_id', tenant.store.id).eq('status', 'open').maybeSingle(),
  ]);
  return <section className="space-y-6"><div className="rounded-2xl border bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">POS</p><h2 className="text-3xl font-bold">Punto de venta básico</h2><p className="text-slate-600">Venta con stock real, caja abierta y registro transaccional.</p></div><PosTerminal customers={customers ?? []} hasOpenCash={Boolean(session)} products={products ?? []} role={tenant.membership.role} /></section>;
}
