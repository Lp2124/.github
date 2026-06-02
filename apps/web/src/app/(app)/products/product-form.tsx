'use client';

import { useActionState } from 'react';
import { createProductAction, updateProductAction, deactivateProductAction, type CatalogActionState } from '@/app/actions/products';
import { SubmitButton } from '@/components/form-status';
import type { Database } from '@/lib/supabase/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['product_categories']['Row'];

export function ProductForm({ product, categories }: Readonly<{ product?: Product; categories: Category[] }>) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState<CatalogActionState, FormData>(action, {});
  const [deactivateState, deactivateAction] = useActionState<CatalogActionState, FormData>(deactivateProductAction, {});
  return (
    <div className="space-y-4">
      <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        {product ? <input name="id" type="hidden" value={product.id} /> : null}
        <label className="space-y-1 text-sm font-semibold text-slate-700">SKU<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.sku} name="sku" required /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Código de barras<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.barcode ?? ''} name="barcode" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">Nombre<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.name} name="name" required /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700 md:col-span-2">Descripción<textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.description ?? ''} name="description" rows={3} /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Categoría<select className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.category_id ?? ''} name="category_id"><option value="">Sin categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Unidad<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.unit ?? 'pieza'} name="unit" required /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Precio venta<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.sale_price ?? 0} min="0" name="sale_price" required step="0.01" type="number" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Costo<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.cost ?? 0} min="0" name="cost" required step="0.01" type="number" /></label>
        <label className="space-y-1 text-sm font-semibold text-slate-700">Stock bajo<input className="w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={product?.low_stock_threshold ?? 0} min="0" name="low_stock_threshold" required type="number" /></label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input defaultChecked={product?.is_active ?? true} name="is_active" type="checkbox" /> Activo</label>
        <div className="md:col-span-2 flex items-center gap-3"><SubmitButton label={product ? 'Actualizar producto' : 'Crear producto'} />{state.error ? <p className="text-sm font-semibold text-red-700">{state.error}</p> : null}{state.success ? <p className="text-sm font-semibold text-green-800">{state.success}</p> : null}</div>
      </form>
      {product?.is_active ? <form action={deactivateAction} className="rounded-2xl border border-red-200 bg-white p-4"><input name="id" type="hidden" value={product.id} /><SubmitButton label="Desactivar producto" />{deactivateState.error ? <p className="mt-2 text-sm font-semibold text-red-700">{deactivateState.error}</p> : null}</form> : null}
    </div>
  );
}
