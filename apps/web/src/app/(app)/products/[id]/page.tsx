import { notFound } from 'next/navigation';
import { ProductForm } from '@/app/(app)/products/product-form';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function ProductDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: movements }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('store_id', tenant.store.id).maybeSingle(),
    supabase.from('product_categories').select('*').eq('store_id', tenant.store.id).order('name'),
    supabase.from('inventory_movements').select('movement_type, quantity_delta, stock_after, reason, created_at').eq('product_id', id).eq('store_id', tenant.store.id).order('created_at', { ascending: false }).limit(20),
  ]);
  if (!product) notFound();
  return <section className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Producto</p><h2 className="text-3xl font-bold text-slate-950">{product.name}</h2></div><ProductForm product={product} categories={categories ?? []} /><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-bold">Historial de inventario</h3>{movements && movements.length > 0 ? <div className="mt-3 divide-y">{movements.map((movement) => <div className="py-3 text-sm" key={`${movement.created_at}-${movement.movement_type}`}><b>{movement.movement_type}</b> · {Number(movement.quantity_delta)} · stock {Number(movement.stock_after)}<p className="text-slate-600">{movement.reason}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-600">Este producto aún no tiene movimientos.</p>}</div></section>;
}
