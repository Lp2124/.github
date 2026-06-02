import Link from 'next/link';
import { createCategoryAction } from '@/app/actions/products';
import { SubmitButton } from '@/components/form-status';
import { canManageCatalog } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function ProductsPage({ searchParams }: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const supabase = await createClient();
  let productQuery = supabase.from('products').select('id, sku, barcode, name, sale_price, cost, current_stock, low_stock_threshold, is_active, product_categories(name)').eq('store_id', tenant.store.id).order('name');
  if (query) productQuery = productQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`);
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    productQuery.limit(100),
    supabase.from('product_categories').select('id, name').eq('store_id', tenant.store.id).order('name'),
  ]);
  if (error) throw new Error('No fue posible cargar productos.');
  const canManage = canManageCatalog(tenant.membership.role);
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Catálogo</p><h2 className="text-3xl font-bold text-slate-950">Productos</h2><p className="text-slate-600">Productos reales filtrados por tienda activa.</p></div>
        {canManage ? <Link className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white" href="/products/new">Nuevo producto</Link> : null}
      </div>
      <form className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><input className="flex-1 rounded-lg border border-slate-300 px-3 py-2" defaultValue={query} name="q" placeholder="Buscar por nombre, SKU o código" /><button className="rounded-lg border border-slate-300 px-4 py-2 font-semibold" type="submit">Buscar</button></form>
      {canManage ? <form action={createCategoryAction} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><input className="flex-1 rounded-lg border border-slate-300 px-3 py-2" name="name" placeholder="Nueva categoría" required /><SubmitButton label="Crear categoría" /></form> : null}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {products && products.length > 0 ? <table className="w-full text-sm"><thead><tr className="border-b bg-slate-50 text-left"><th className="p-3">SKU</th><th className="p-3">Nombre</th><th className="p-3">Categoría</th><th className="p-3">Precio</th><th className="p-3">Stock</th><th className="p-3">Estado</th></tr></thead><tbody>{products.map((product) => <tr className="border-b" key={product.id}><td className="p-3 font-mono">{product.sku}</td><td className="p-3"><Link className="font-semibold text-green-800" href={`/products/${product.id}`}>{product.name}</Link></td><td className="p-3">{product.product_categories?.name ?? 'Sin categoría'}</td><td className="p-3">${Number(product.sale_price).toFixed(2)}</td><td className={Number(product.current_stock) <= Number(product.low_stock_threshold) ? 'p-3 font-bold text-red-700' : 'p-3'}>{Number(product.current_stock)}</td><td className="p-3">{product.is_active ? 'Activo' : 'Inactivo'}</td></tr>)}</tbody></table> : <p className="p-6 text-sm text-slate-600">No hay productos registrados para esta tienda o búsqueda.</p>}
      </div>
      <p className="text-xs text-slate-500">Categorías disponibles: {categories?.length ?? 0}</p>
    </section>
  );
}
