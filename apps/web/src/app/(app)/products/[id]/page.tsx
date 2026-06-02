import { notFound } from 'next/navigation';
import { DeactivateProductForm } from '@/app/(app)/products/deactivate-product-form';
import { ProductForm } from '@/app/(app)/products/product-form';
import { canManageProducts } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { uuidSchema } from '@/lib/security/validation';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function ProductDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  const supabase = await createClient();
  const { id } = await params;
  const productId = uuidSchema.safeParse(id);

  if (!productId.success) notFound();

  const [{ data: product, error: productError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', productId.data)
      .eq('store_id', tenant.store.id)
      .maybeSingle(),
    supabase
      .from('product_categories')
      .select('*')
      .eq('store_id', tenant.store.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ]);

  if (productError || categoriesError) {
    throw new Error('No fue posible cargar el producto.');
  }

  if (!product) notFound();

  const canManage = canManageProducts(tenant.membership.role);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-800">Productos</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">{product.name}</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Detalle y edición del producto en la tienda activa.</p>
      </div>
      <ProductForm product={product} categories={categories ?? []} canManage={canManage} />
      <DeactivateProductForm productId={product.id} canManage={canManage} isActive={product.is_active} />
    </section>
  );
}
