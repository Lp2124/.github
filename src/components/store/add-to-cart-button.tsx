"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CartItem = { productId: string; quantity: number };

function readCart(): CartItem[] {
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

export function AddToCartButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const [message, setMessage] = useState("");
  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={disabled}
        onClick={() => {
          const cart = readCart();
          const existing = cart.find((item) => item.productId === productId);
          if (existing) existing.quantity += 1;
          else cart.push({ productId, quantity: 1 });
          localStorage.setItem("ferreteria_cart", JSON.stringify(cart));
          setMessage("Producto agregado al carrito.");
        }}
      >
        {disabled ? "Sin stock" : "Agregar al carrito"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
