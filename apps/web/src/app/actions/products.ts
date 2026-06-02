'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeAuditLog } from '@/lib/audit/log';
import { canManageProducts } from '@/lib/auth/roles';
import { requireUser } from '@/lib/auth/session';
import { productFormSchema } from '@/lib/products/schema';
import { assertSameOriginRequest } from '@/lib/security/csrf';
import { uuidSchema } from '@/lib/security/validation';
import { createClient } from '@/lib/supabase/server';
import { requireTenantContext } from '@/lib/tenant/context';

export type ProductActionState = { error?: string; success?: string };

type ProductPayload = {
  category_id: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  sale_price: number;
  cost_price: number | null;
  is_active: boolean;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function parseProductForm(formData: FormData, includeProductId = false) {
  return productFormSchema.safeParse({
    ...(includeProductId ? { productId: getString(formData, 'productId') } : {}),
    categoryId: getString(formData, 'categoryId'),
    categoryName: getString(formData, 'categoryName'),
    sku: getString(formData, 'sku'),
    name: getString(formData, 'name'),
    description: getString(formData, 'description'),
    unit: getString(formData, 'unit') || 'pieza',
    salePrice: getString(formData, 'salePrice'),
    costPrice: getString(formData, 'costPrice'),
    isActive: formData.get('isActive'),
  });
}

async function resolveCategoryId(input: { storeId: string; categoryId: string | null; categoryName: string | null }) {
  if (input.categoryId) return input.categoryId;
  if (!input.categoryName) return null;

  const supabase = await createClient();
  const name = input.categoryName.trim();
  const { data: existing, error: lookupError } = await supabase
    .from('product_categories')
    .select('id')
    .eq('store_id', input.storeId)
    .ilike('name', name)
    .maybeSingle();

  if (lookupError) {
    throw new Error('No fue posible validar la categoría del producto.');
  }

  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from('product_categories')
    .insert({ store_id: input.storeId, name })
    .select('id')
    .single();

  if (createError || !created) {
    throw new Error('No fue posible crear la categoría del producto.');
  }

  return created.id;
}

async function assertProductCategoryBelongsToStore(storeId: string, categoryId: string | null) {
  if (!categoryId) return;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('La categoría seleccionada no existe en la tienda activa.');
  }
}

async function buildPayload(storeId: string, formData: FormData, includeProductId = false) {
  const parsed = parseProductForm(formData, includeProductId);
  if (!parsed.success) {
    throw new Error('Revisa los campos del producto. Nombre, unidad y precios deben ser válidos.');
  }

  const categoryId = await resolveCategoryId({ storeId, categoryId: parsed.data.categoryId, categoryName: parsed.data.categoryName });
  await assertProductCategoryBelongsToStore(storeId, categoryId);

  const payload: ProductPayload = {
    category_id: categoryId,
    sku: parsed.data.sku,
    name: parsed.data.name,
    description: parsed.data.description,
    unit: parsed.data.unit,
    sale_price: parsed.data.salePrice,
    cost_price: parsed.data.costPrice,
    is_active: parsed.data.isActive,
  };

  return { parsed: parsed.data, payload };
}

export async function createProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!canManageProducts(tenant.membership.role)) {
    return { error: 'No tienes permisos para crear productos.' };
  }

  let productId: string;
  try {
    const { payload } = await buildPayload(tenant.store.id, formData);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .insert({ store_id: tenant.store.id, ...payload })
      .select('id')
      .single();

    if (error || !data) {
      return { error: 'No fue posible crear el producto. Verifica que el SKU no esté duplicado en esta tienda.' };
    }

    productId = data.id;
    await writeAuditLog({
      storeId: tenant.store.id,
      actorId: user.id,
      action: 'product.create',
      entityType: 'products',
      entityId: productId,
      metadata: { sku: payload.sku, name: payload.name, categoryId: payload.category_id },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible crear el producto.' };
  }

  revalidatePath('/products');
  redirect(`/products/${productId}`);
}

export async function updateProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!canManageProducts(tenant.membership.role)) {
    return { error: 'No tienes permisos para editar productos.' };
  }

  const productId = uuidSchema.safeParse(formData.get('productId'));
  if (!productId.success) {
    return { error: 'El producto solicitado no es válido.' };
  }

  try {
    const { payload } = await buildPayload(tenant.store.id, formData, true);
    const supabase = await createClient();
    const { data: current, error: loadError } = await supabase
      .from('products')
      .select('id, sku, name, category_id, is_active')
      .eq('id', productId.data)
      .eq('store_id', tenant.store.id)
      .maybeSingle();

    if (loadError || !current) {
      return { error: 'El producto solicitado no existe en la tienda activa.' };
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId.data)
      .eq('store_id', tenant.store.id);

    if (updateError) {
      return { error: 'No fue posible actualizar el producto. Verifica que el SKU no esté duplicado en esta tienda.' };
    }

    await writeAuditLog({
      storeId: tenant.store.id,
      actorId: user.id,
      action: 'product.update',
      entityType: 'products',
      entityId: productId.data,
      metadata: {
        previous: { sku: current.sku, name: current.name, categoryId: current.category_id, isActive: current.is_active },
        next: { sku: payload.sku, name: payload.name, categoryId: payload.category_id, isActive: payload.is_active },
      },
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No fue posible actualizar el producto.' };
  }

  revalidatePath('/products');
  revalidatePath(`/products/${productId.data}`);
  return { success: 'Producto actualizado correctamente.' };
}

export async function deactivateProductAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await assertSameOriginRequest();
  const user = await requireUser();
  const tenant = await requireTenantContext(user.id);

  if (!canManageProducts(tenant.membership.role)) {
    return { error: 'No tienes permisos para desactivar productos.' };
  }

  const productId = uuidSchema.safeParse(formData.get('productId'));
  if (!productId.success) {
    return { error: 'El producto solicitado no es válido.' };
  }

  const supabase = await createClient();
  const { data: current, error: loadError } = await supabase
    .from('products')
    .select('id, sku, name, is_active')
    .eq('id', productId.data)
    .eq('store_id', tenant.store.id)
    .maybeSingle();

  if (loadError || !current) {
    return { error: 'El producto solicitado no existe en la tienda activa.' };
  }

  if (!current.is_active) {
    return { success: 'El producto ya estaba inactivo.' };
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId.data)
    .eq('store_id', tenant.store.id);

  if (updateError) {
    return { error: 'No fue posible desactivar el producto.' };
  }

  await writeAuditLog({
    storeId: tenant.store.id,
    actorId: user.id,
    action: 'product.deactivate',
    entityType: 'products',
    entityId: productId.data,
    metadata: { sku: current.sku, name: current.name },
  });

  revalidatePath('/products');
  revalidatePath(`/products/${productId.data}`);
  return { success: 'Producto desactivado correctamente.' };
}
