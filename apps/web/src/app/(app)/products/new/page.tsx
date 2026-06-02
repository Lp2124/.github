import { ProductForm } from '@/app/(app)/products/product-form';
import { canManageProducts } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function NewProductPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const canManage = canManageProducts(tenant.membership.role);

  const { data: categories, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('store_id', tenant.store.id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error('No fue posible cargar categorías.');
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Productos</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">Crear producto</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Alta real de producto para la tienda activa con validación server-side, RLS y auditoría.</p>
      </div>
      <ProductForm categories={categories ?? []} canManage={canManage} />
    </section>
  );
}
