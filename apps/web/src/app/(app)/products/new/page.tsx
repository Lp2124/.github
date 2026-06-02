import { ProductForm } from '@/app/(app)/products/product-form';
import { canManageCatalog } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export default async function NewProductPage() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canManageCatalog(tenant.membership.role)) return <p className="rounded-2xl border border-red-200 bg-white p-6 font-semibold text-red-700">No tienes permisos para crear productos.</p>;
  const supabase = await createClient();
  const { data: categories } = await supabase.from('product_categories').select('*').eq('store_id', tenant.store.id).order('name');
  return <section className="space-y-4"><h2 className="text-3xl font-bold text-slate-950">Nuevo producto</h2><ProductForm categories={categories ?? []} /></section>;
}
