"use client";

import { useMemo, useState, useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSaleAction, type PosActionState } from "@/features/pos/actions/pos-actions";
import type { PosProduct } from "@/features/pos/services/pos-service";

type CartLine = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
};
type PaymentLine = {
  payment_method: "efectivo" | "tarjeta" | "transferencia";
  amount: number;
  reference: string | null;
};
const initialState: PosActionState = { status: "idle", message: "" };

export function PosSaleForm({
  products,
  warehouses,
  hasActiveShift
}: {
  products: PosProduct[];
  warehouses: { id: string; name: string }[];
  hasActiveShift: boolean;
}) {
  const [state, action, isPending] = useActionState(createSaleAction, initialState);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payments, setPayments] = useState<PaymentLine[]>([
    { payment_method: "efectivo", amount: 0, reference: null }
  ]);
  const [discountTotal, setDiscountTotal] = useState(0);
  const filtered = products
    .filter((product) =>
      `${product.sku} ${product.name} ${product.barcode ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .slice(0, 20);
  const subtotal = useMemo(
    () =>
      cart.reduce((total, line) => total + line.quantity * line.unitPrice - line.discountAmount, 0),
    [cart]
  );
  const total = Math.max(subtotal - discountTotal, 0);
  const paymentTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  function addProduct(product: PosProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing)
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      return [
        ...current,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitPrice: product.salePrice,
          discountAmount: 0
        }
      ];
    });
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          cart.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            discount_amount: line.discountAmount
          }))
        )}
      />
      <input type="hidden" name="payments" value={JSON.stringify(payments)} />
      <input type="hidden" name="discountTotal" value={discountTotal} />
      <Card>
        <CardHeader>
          <CardTitle>Venta rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActionMessage state={state} />
          {state.saleId ? (
            <a className="text-sm text-primary underline" href={`/pos/ventas/${state.saleId}`}>
              Ver ticket de venta
            </a>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="warehouseId">Almacén de venta</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar producto"
          />
          <div className="grid gap-2 md:grid-cols-2">
            {filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="rounded-md border p-3 text-left hover:bg-accent"
              >
                <p className="font-medium">
                  {product.sku} — {product.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Stock: {product.availableStock} / Precio: ${product.salePrice.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Carrito y pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.map((line) => (
            <div key={line.productId} className="space-y-2 rounded-md border p-3">
              <p className="font-medium">
                {line.sku} — {line.name}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={line.quantity}
                  onChange={(event) =>
                    setCart((items) =>
                      items.map((item) =>
                        item.productId === line.productId
                          ? { ...item, quantity: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) =>
                    setCart((items) =>
                      items.map((item) =>
                        item.productId === line.productId
                          ? { ...item, unitPrice: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.discountAmount}
                  onChange={(event) =>
                    setCart((items) =>
                      items.map((item) =>
                        item.productId === line.productId
                          ? { ...item, discountAmount: Number(event.target.value) }
                          : item
                      )
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCart((items) => items.filter((item) => item.productId !== line.productId))
                }
              >
                Quitar
              </Button>
            </div>
          ))}
          <div className="space-y-2">
            <Label>Descuento general</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discountTotal}
              onChange={(event) => setDiscountTotal(Number(event.target.value))}
            />
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Total: ${total.toFixed(2)}</p>
            <p>Pagos: ${paymentTotal.toFixed(2)}</p>
          </div>
          {payments.map((payment, index) => (
            <div key={`${payment.payment_method}-${index}`} className="grid grid-cols-3 gap-2">
              <select
                value={payment.payment_method}
                onChange={(event) =>
                  setPayments((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            payment_method: event.target.value as PaymentLine["payment_method"]
                          }
                        : item
                    )
                  )
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={payment.amount}
                onChange={(event) =>
                  setPayments((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, amount: Number(event.target.value) } : item
                    )
                  )
                }
              />
              <Input
                value={payment.reference ?? ""}
                onChange={(event) =>
                  setPayments((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, reference: event.target.value || null }
                        : item
                    )
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setPayments((items) => [
                ...items,
                { payment_method: "efectivo", amount: 0, reference: null }
              ])
            }
          >
            Agregar pago mixto
          </Button>
          <Button
            type="submit"
            disabled={
              !hasActiveShift ||
              isPending ||
              cart.length === 0 ||
              Math.abs(paymentTotal - total) > 0.001
            }
            className="w-full"
          >
            {isPending ? "Cobrando..." : "Cobrar venta"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
