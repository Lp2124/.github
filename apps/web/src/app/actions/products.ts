'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAuditLog } from '@/lib/audit/log';
import { canManageCatalog } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { productSchema, categorySchema } from '@/lib/operations/schemas';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { uuidSchema } from '@/lib/security/validation';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type CatalogActionState = { error?: string; success?: string };

async function requireCatalogManager() {
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);
  if (!canManageCatalog(tenant.membership.role)) {
    throw new Error('No tienes permisos para administrar productos.');
  }
  return { user, tenant };
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCatalogManager();
    const parsed = categorySchema.safeParse({ name: formData.get('name') });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Categoría inválida.');
    const supabase = await createClient();
    const { data, error } = await supabase.from('product_categories').insert({ store_id: tenant.store.id, name: parsed.data.name }).select('id').single();
    if (error) throw new Error('No fue posible crear la categoría.');
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'category.create', entityType: 'product_categories', entityId: data.id, metadata: { name: parsed.data.name } });
    revalidatePath('/products');
    return;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error inesperado.');
  }
}

export async function createProductAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  await assertSameOriginRequest();
  let productId: string | null = null;
  try {
    const { user, tenant } = await requireCatalogManager();
    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Producto inválido.' };
    const supabase = await createClient();
    const { data, error } = await supabase.from('products').insert({ ...parsed.data, store_id: tenant.store.id, current_stock: 0 }).select('id').single();
    if (error) return { error: 'No fue posible crear el producto. Revisa que el SKU/código no esté duplicado.' };
    productId = data.id;
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'product.create', entityType: 'products', entityId: data.id, metadata: { sku: parsed.data.sku, name: parsed.data.name } });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
  revalidatePath('/products');
  redirect(`/products/${productId}`);
}

export async function updateProductAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCatalogManager();
    const id = uuidSchema.safeParse(formData.get('id'));
    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!id.success || !parsed.success) return { error: parsed.success ? 'Producto inválido.' : (parsed.error.issues[0]?.message ?? 'Producto inválido.') };
    const supabase = await createClient();
    const { error } = await supabase.from('products').update({ ...parsed.data, updated_at: new Date().toISOString() }).eq('id', id.data).eq('store_id', tenant.store.id);
    if (error) return { error: 'No fue posible actualizar el producto.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'product.update', entityType: 'products', entityId: id.data, metadata: { sku: parsed.data.sku, name: parsed.data.name } });
    revalidatePath('/products');
    revalidatePath(`/products/${id.data}`);
    return { success: 'Producto actualizado.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}

export async function deactivateProductAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  await assertSameOriginRequest();
  try {
    const { user, tenant } = await requireCatalogManager();
    const id = uuidSchema.safeParse(formData.get('id'));
    if (!id.success) return { error: 'Producto inválido.' };
    const supabase = await createClient();
    const { error } = await supabase.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id.data).eq('store_id', tenant.store.id);
    if (error) return { error: 'No fue posible desactivar el producto.' };
    await writeAuditLog({ storeId: tenant.store.id, actorId: user.id, action: 'product.deactivate', entityType: 'products', entityId: id.data });
    revalidatePath('/products');
    revalidatePath(`/products/${id.data}`);
    return { success: 'Producto desactivado.' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
}
