'use client';

import { useMemo, useState, useActionState } from 'react';
import { completeSaleAction, type SaleActionState } from '@/app/actions/sales';
import { SubmitButton } from '@/components/form-status';
import { canApplySaleDiscount } from '@/lib/auth/roles';
import type { Database, StoreRole } from '@/lib/supabase/database.types';

type Product = Pick<Database['public']['Tables']['products']['Row'], 'id' | 'sku' | 'barcode' | 'name' | 'sale_price' | 'current_stock' | 'is_active'>;
type Customer = Pick<Database['public']['Tables']['customers']['Row'], 'id' | 'name'>;
type CartItem = { product: Product; quantity: number; discountAmount: number };

export function PosTerminal({ products, customers, role, hasOpenCash }: Readonly<{ products: Product[]; customers: Customer[]; role: StoreRole; hasOpenCash: boolean }>) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [state, action] = useActionState<SaleActionState, FormData>(completeSaleAction, {});
  const canDiscount = canApplySaleDiscount(role);

  const filtered = products
    .filter((product) => `${product.sku} ${product.barcode ?? ''} ${product.name}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.product.sale_price) * item.quantity - item.discountAmount, 0), [cart]);
  const totalDiscount = canDiscount ? globalDiscount : 0;
  const total = Math.max(0, subtotal - totalDiscount);
  const payload = JSON.stringify({
    customer_id: customerId || null,
    discount_amount: totalDiscount,
    items: cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: Number(item.product.sale_price),
      discountAmount: item.discountAmount,
    })),
  });

  function addProduct(product: Product) {
    setCart((items) => {
      const found = items.find((item) => item.product.id === product.id);
      if (found) {
        return items.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(Number(product.current_stock), item.quantity + 1) } : item);
      }
      return [...items, { product, quantity: 1, discountAmount: 0 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((items) => items.map((item) => item.product.id === productId ? { ...item, quantity: Math.max(0.001, Math.min(Number(item.product.current_stock), quantity)) } : item));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Buscar productos</h3>
        <input className="w-full rounded-lg border px-3 py-2" onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, SKU o código de barras" value={query} />
        {filtered.length ? (
          <div className="divide-y">
            {filtered.map((product) => (
              <button className="flex w-full items-center justify-between py-3 text-left hover:bg-slate-50 disabled:opacity-50" disabled={!hasOpenCash || Number(product.current_stock) <= 0} key={product.id} onClick={() => addProduct(product)} type="button">
                <span><b>{product.sku}</b> · {product.name}<br /><small>Stock {Number(product.current_stock)}</small></span>
                <span className="font-bold">{`$${Number(product.sale_price).toFixed(2)}`}</span>
              </button>
            ))}
          </div>
        ) : <p className="text-sm text-slate-600">No hay productos activos que coincidan.</p>}
      </section>
      <form action={action} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Carrito</h3>
        {!hasOpenCash ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">Abre caja antes de vender.</p> : null}
        <select className="w-full rounded-lg border px-3 py-2" onChange={(event) => setCustomerId(event.target.value)} value={customerId}>
          <option value="">Cliente mostrador</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
        </select>
        <div className="divide-y">
          {cart.map((item) => (
            <div className="py-3" key={item.product.id}>
              <div className="flex justify-between"><b>{item.product.name}</b><button className="text-sm font-semibold text-red-700" onClick={() => setCart((items) => items.filter((entry) => entry.product.id !== item.product.id))} type="button">Remover</button></div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input className="rounded-lg border px-2 py-1" max={Number(item.product.current_stock)} min="0.001" onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))} step="0.001" type="number" value={item.quantity} />
                <input className="rounded-lg border px-2 py-1" disabled={!canDiscount} min="0" onChange={(event) => setCart((items) => items.map((entry) => entry.product.id === item.product.id ? { ...entry, discountAmount: Number(event.target.value) } : entry))} step="0.01" type="number" value={item.discountAmount} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{`$${Number(item.product.sale_price).toFixed(2)} c/u`}</p>
            </div>
          ))}
        </div>
        {!cart.length ? <p className="text-sm text-slate-600">El carrito está vacío.</p> : null}
        <label className="block text-sm font-semibold">Descuento global<input className="mt-1 w-full rounded-lg border px-3 py-2" disabled={!canDiscount} min="0" onChange={(event) => setGlobalDiscount(Number(event.target.value))} step="0.01" type="number" value={globalDiscount} /></label>
        <div className="space-y-1 border-t pt-3 text-sm"><p>{`Subtotal: $${subtotal.toFixed(2)}`}</p><p>{`Descuento: $${totalDiscount.toFixed(2)}`}</p><p className="text-xl font-bold">{`Total: $${total.toFixed(2)}`}</p></div>
        <input name="payload" type="hidden" value={payload} />
        <SubmitButton label="Completar venta" pendingLabel="Procesando venta..." />
        {state.error ? <p className="text-sm font-semibold text-red-700">{state.error}</p> : null}
        {state.success ? <p className="text-sm font-semibold text-green-800">{state.success}</p> : null}
      </form>
    </div>
  );
}
