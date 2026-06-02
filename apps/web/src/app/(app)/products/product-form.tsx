'use client';

import { useActionState } from 'react';
import { createProductAction, updateProductAction, type ProductActionState } from '@/app/actions/products';
import type { Database } from '@/lib/supabase/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['product_categories']['Row'];

const initialState: ProductActionState = {};

export function ProductForm({ product, categories, canManage }: Readonly<{ product?: Product; categories: Category[]; canManage: boolean }>) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const disabled = !canManage || pending;

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="name">Nombre</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="name"
            name="name"
            defaultValue={product?.name ?? ''}
            minLength={2}
            maxLength={180}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="sku">SKU</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="sku"
            name="sku"
            defaultValue={product?.sku ?? ''}
            maxLength={80}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="description">Descripción</label>
        <textarea
          className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
          id="description"
          name="description"
          defaultValue={product?.description ?? ''}
          maxLength={2000}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="categoryId">Categoría existente</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="categoryId"
            name="categoryId"
            defaultValue={product?.category_id ?? ''}
            disabled={disabled}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="categoryName">Nueva categoría</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="categoryName"
            name="categoryName"
            maxLength={120}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="unit">Unidad</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? 'pieza'}
            maxLength={40}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="salePrice">Precio venta</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="salePrice"
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.sale_price ?? 0}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="costPrice">Costo</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100"
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={product?.cost_price ?? ''}
            disabled={disabled}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input className="h-4 w-4 rounded border-slate-300 text-green-700" type="checkbox" name="isActive" defaultChecked={product?.is_active ?? true} disabled={disabled} />
        Producto activo
      </label>

      {!canManage ? <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">Tu rol permite consultar productos, pero no crear ni editar.</p> : null}
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{state.success}</p> : null}
      <button
        className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-green-800"
        type="submit"
        disabled={disabled}
      >
        {pending ? 'Guardando…' : product ? 'Guardar producto' : 'Crear producto'}
      </button>
    </form>
  );
}
