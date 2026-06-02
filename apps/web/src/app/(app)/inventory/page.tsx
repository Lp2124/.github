import Link from 'next/link';
import { canManageCatalog } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function InventoryPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const [{ data: products, error }, { data: movements }] = await Promise.all([
    supabase.from('products').select('id, sku, name, current_stock, low_stock_threshold, unit, is_active').eq('store_id', tenant.store.id).order('name'),
    supabase.from('inventory_movements').select('product_id, movement_type, quantity_delta, stock_after, reason, created_at').eq('store_id', tenant.store.id).order('created_at', { ascending: false }).limit(30),
  ]);
  if (error) throw new Error('No fue posible cargar inventario.');
  const lowStock = (products ?? []).filter((product) => Number(product.current_stock) <= Number(product.low_stock_threshold));
  return <section className="space-y-6"><div className="flex flex-col gap-3 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Inventario</p><h2 className="text-3xl font-bold">Stock actual</h2><p className="text-slate-600">Stock mantenido por movimientos auditados.</p></div>{canManageCatalog(tenant.membership.role) ? <Link className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white" href="/inventory/adjustments">Registrar ajuste</Link> : null}</div><div className="grid gap-4 md:grid-cols-3"><Metric label="Productos" value={String(products?.length ?? 0)} /><Metric label="Stock bajo" value={String(lowStock.length)} /><Metric label="Rol" value={tenant.membership.role} /></div><div className="rounded-2xl border bg-white shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left"><th className="p-3">SKU</th><th className="p-3">Producto</th><th className="p-3">Stock</th><th className="p-3">Umbral</th><th className="p-3">Estado</th></tr></thead><tbody>{products?.map((product) => <tr className="border-b" key={product.id}><td className="p-3 font-mono">{product.sku}</td><td className="p-3">{product.name}</td><td className={Number(product.current_stock) <= Number(product.low_stock_threshold) ? 'p-3 font-bold text-red-700' : 'p-3'}>{Number(product.current_stock)} {product.unit}</td><td className="p-3">{Number(product.low_stock_threshold)}</td><td className="p-3">{product.is_active ? 'Activo' : 'Inactivo'}</td></tr>)}</tbody></table>{!products?.length ? <p className="p-6 text-sm text-slate-600">No hay productos para mostrar inventario.</p> : null}</div><div className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">Movimientos recientes</h3>{movements?.length ? <div className="mt-3 divide-y">{movements.map((movement) => <div className="py-3 text-sm" key={`${movement.created_at}-${movement.reason}`}><b>{movement.product_id}</b><p>{movement.movement_type} · {Number(movement.quantity_delta)} · stock {Number(movement.stock_after)}</p><p className="text-slate-600">{movement.reason}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-600">Sin movimientos registrados.</p>}</div></section>;
}
function Metric({ label, value }: Readonly<{ label: string; value: string }>) { return <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
