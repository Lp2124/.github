"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/features/store/services/store-service";

type CartItem = { productId: string; quantity: number };

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("ferreteria_cart") ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          "productId" in item &&
          "quantity" in item &&
          typeof item.productId === "string" &&
          typeof item.quantity === "number" &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0
      )
      .map((item) => ({ productId: item.productId, quantity: Math.floor(item.quantity) }));
  } catch {
    localStorage.removeItem("ferreteria_cart");
    return [];
  }
}

export function CartClient({ products }: { products: StoreProduct[] }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  function save(next: CartItem[]) {
    setItems(next);
    localStorage.setItem("ferreteria_cart", JSON.stringify(next));
  }
  const lines = items
    .map((item) => ({ item, product: products.find((p) => p.id === item.productId) }))
    .filter((line): line is { item: CartItem; product: StoreProduct } => Boolean(line.product));
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.price * line.item.quantity, 0),
    [lines]
  );
  const iva = subtotal * 0.16;
  return (
    <div className="space-y-4">
      {lines.map(({ item, product }) => (
        <div key={product.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              ${product.price.toFixed(2)} / Stock {product.stock}
            </p>
          </div>
          <input
            className="h-10 w-24 rounded-md border px-2"
            type="number"
            min="1"
            max={product.stock}
            value={item.quantity}
            onChange={(event) => {
              const nextQuantity = Math.min(
                product.stock,
                Math.max(1, Math.floor(Number(event.target.value) || 1))
              );
              save(
                items.map((i) =>
                  i.productId === item.productId ? { ...i, quantity: nextQuantity } : i
                )
              );
            }}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => save(items.filter((i) => i.productId !== item.productId))}
          >
            Quitar
          </Button>
        </div>
      ))}
      {lines.length === 0 ? (
        <p>No hay productos en el carrito.</p>
      ) : (
        <div className="rounded-lg bg-muted p-4">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA: ${iva.toFixed(2)}</p>
          <p className="font-bold">Total: ${(subtotal + iva).toFixed(2)}</p>
          <Button asChild className="mt-4">
            <Link href="/tienda/checkout">Checkout</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
