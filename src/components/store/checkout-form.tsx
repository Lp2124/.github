"use client";

import { useEffect, useState, useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkoutAction, type StoreActionState } from "@/features/store/actions/store-actions";

const initialState: StoreActionState = { status: "idle", message: "" };

type CartItem = { productId: string; quantity: number };

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("ferreteria_cart") ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        "quantity" in item &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number" &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );
  } catch {
    localStorage.removeItem("ferreteria_cart");
    return [];
  }
}

export function CheckoutForm({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [items] = useState<CartItem[]>(readCart);
  const [state, action, pending] = useActionState(checkoutAction, initialState);
  useEffect(() => {
    if (state.redirectUrl) {
      localStorage.removeItem("ferreteria_cart");
      window.location.href = state.redirectUrl;
    }
  }, [state.redirectUrl]);
  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <ActionMessage state={state} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {!isAuthenticated ? (
        <p className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
          Debes iniciar sesión para crear un pedido real.
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" />
      </div>
      <Button type="submit" disabled={!isAuthenticated || pending || items.length === 0}>
        {pending ? "Creando pedido..." : "Pagar con Mercado Pago"}
      </Button>
    </form>
  );
}
