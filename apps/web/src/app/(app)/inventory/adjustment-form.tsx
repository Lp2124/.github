'use client';

import { useActionState } from 'react';
import { createInventoryAdjustmentAction, type InventoryActionState } from '@/app/actions/inventory';
import { SubmitButton } from '@/components/form-status';
import type { Database } from '@/lib/supabase/database.types';

type Product = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'sku' | 'name' | 'current_stock'>;

export function AdjustmentForm({ products }: Readonly<{ products: Product[] }>) {
  const [state, action] = useActionState<InventoryActionState, FormData>(createInventoryAdjustmentAction, {});
  return <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"><label className="space-y-1 text-sm font-semibold">Producto<select className="w-full rounded-lg border border-slate-300 px-3 py-2" name="product_id" required>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} · {product.name} · stock {Number(product.current_stock)}</option>)}</select></label><label className="space-y-1 text-sm font-semibold">Tipo<select className="w-full rounded-lg border border-slate-300 px-3 py-2" name="movement_type"><option value="initial">Inicial</option><option value="purchase">Compra</option><option value="adjustment">Ajuste</option><option value="return">Devolución</option><option value="correction">Corrección</option></select></label><label className="space-y-1 text-sm font-semibold">Cantidad delta<input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="quantity_delta" required step="0.001" type="number" /></label><label className="space-y-1 text-sm font-semibold">Referencia<input className="w-full rounded-lg border border-slate-300 px-3 py-2" name="reference" /></label><label className="space-y-1 text-sm font-semibold md:col-span-2">Razón<textarea className="w-full rounded-lg border border-slate-300 px-3 py-2" name="reason" required rows={3} /></label><div className="md:col-span-2 flex items-center gap-3"><SubmitButton label="Registrar ajuste" />{state.error ? <p className="text-sm font-semibold text-red-700">{state.error}</p> : null}{state.success ? <p className="text-sm font-semibold text-green-800">{state.success}</p> : null}</div></form>;
}
