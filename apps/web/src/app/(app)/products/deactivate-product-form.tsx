'use client';

import { useActionState } from 'react';
import { deactivateProductAction, type ProductActionState } from '@/app/actions/products';

const initialState: ProductActionState = {};

export function DeactivateProductForm({ productId, canManage, isActive }: Readonly<{ productId: string; canManage: boolean; isActive: boolean }>) {
  const [state, formAction, pending] = useActionState(deactivateProductAction, initialState);
  const disabled = !canManage || !isActive || pending;

  return (
    <form action={formAction} className="space-y-2 rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
      <input type="hidden" name="productId" value={productId} />
      <h3 className="text-lg font-bold text-slate-950">Desactivar producto</h3>
      <p className="text-sm text-slate-600">La desactivación conserva el historial y evita eliminar datos de catálogo.</p>
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{state.success}</p> : null}
      <button className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={disabled}>
        {pending ? 'Desactivando…' : isActive ? 'Desactivar producto' : 'Producto inactivo'}
      </button>
    </form>
  );
}
