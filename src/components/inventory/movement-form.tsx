"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryActionState } from "@/features/inventory/actions/inventory-actions";
import { registerMovementAction } from "@/features/inventory/actions/inventory-actions";
import type {
  ProductListItem,
  WarehouseOption
} from "@/features/inventory/services/inventory-service";

const initialState: InventoryActionState = { status: "idle", message: "" };

export function MovementForm({
  products,
  warehouses
}: {
  products: ProductListItem[];
  warehouses: WarehouseOption[];
}) {
  const [state, action, isPending] = useActionState(registerMovementAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar movimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <ActionMessage state={state} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productId">Producto</Label>
            <select
              id="productId"
              name="productId"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} — {product.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="movementType">Tipo</Label>
            <select
              id="movementType"
              name="movementType"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
              <option value="merma">Merma</option>
              <option value="devolucion">Devolución</option>
              <option value="traspaso">Traspaso</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouseId">Almacén origen</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.branchName} / {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destinationWarehouseId">Almacén destino para traspaso</Label>
            <select
              id="destinationWarehouseId"
              name="destinationWarehouseId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">No aplica</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.branchName} / {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input id="quantity" name="quantity" type="number" min="0.001" step="0.001" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjustmentDirection">Dirección para ajuste</Label>
            <select
              id="adjustmentDirection"
              name="adjustmentDirection"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="increase">Incrementar</option>
              <option value="decrease">Disminuir</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reason">Motivo auditable</Label>
            <textarea
              id="reason"
              name="reason"
              required
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="referenceDocument">Documento de referencia</Label>
            <Input id="referenceDocument" name="referenceDocument" />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isPending || products.length === 0 || warehouses.length === 0}
            >
              {isPending ? "Registrando..." : "Registrar movimiento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
