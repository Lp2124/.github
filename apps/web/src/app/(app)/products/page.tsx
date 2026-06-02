import Link from 'next/link';
import { canManageProducts } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { productSearchSchema } from '@/lib/products/schema';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function ProductsPage({ searchParams }: Readonly<{ searchParams?: Promise<{ q?: string }> }>) {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const params = await searchParams;
  const search = productSearchSchema.parse(params?.q ?? '');
  const canManage = canManageProducts(tenant.membership.role);

  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
    (() => {
      let query = supabase
        .from('products')
        .select('id, category_id, sku, name, unit, sale_price, cost_price, is_active, updated_at')
        .eq('store_id', tenant.store.id)
        .order('name', { ascending: true })
        .limit(100);

      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      return query;
    })(),
    supabase
      .from('product_categories')
      .select('id, name')
      .eq('store_id', tenant.store.id)
      .order('name', { ascending: true }),
  ]);

  if (productsError || categoriesError) {
    throw new Error('No fue posible cargar productos.');
  }

  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Productos</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Catálogo de productos</h2>
            <p className="mt-2 max-w-3xl text-slate-600">Productos reales de la tienda activa, filtrados por store_id y protegidos con RLS.</p>
          </div>
          {canManage ? (
            <Link className="rounded-lg bg-green-800 px-4 py-2 text-sm font-bold text-white hover:bg-green-900" href="/products/new">
              Crear producto
            </Link>
          ) : null}
        </div>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" action="/products">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="q">Buscar por nombre o SKU</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
            id="q"
            name="q"
            defaultValue={search}
            maxLength={80}
          />
          <button className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100" type="submit">Buscar</button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Unidad</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(products ?? []).map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{product.sku ?? 'Sin SKU'}</td>
                <td className="px-4 py-3 font-semibold text-slate-950">{product.name}</td>
                <td className="px-4 py-3 text-slate-600">{product.category_id ? categoryNames.get(product.category_id) ?? 'Categoría no disponible' : 'Sin categoría'}</td>
                <td className="px-4 py-3 text-slate-600">{product.unit}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">${Number(product.sale_price).toFixed(2)}</td>
                <td className="px-4 py-3">{product.is_active ? <span className="text-green-800">Activo</span> : <span className="text-slate-500">Inactivo</span>}</td>
                <td className="px-4 py-3">
                  <Link className="font-semibold text-green-800 hover:text-green-950" href={`/products/${product.id}`}>Ver detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products?.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            {search ? 'No se encontraron productos con ese nombre o SKU en esta tienda.' : 'No hay productos registrados para esta tienda.'}
          </div>
        ) : null}
      </div>
    </section>
  );
}
