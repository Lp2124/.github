"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/inventory/action-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryActionState } from "@/features/inventory/actions/inventory-actions";
import { updateStockSettingsAction } from "@/features/inventory/actions/inventory-actions";
import type {
  ProductDetail,
  WarehouseOption
} from "@/features/inventory/services/inventory-service";

const initialState: InventoryActionState = { status: "idle", message: "" };

export function StockSettingsForm({
  product,
  warehouses
}: {
  product: ProductDetail;
  warehouses: WarehouseOption[];
}) {
  const [state, action, isPending] = useActionState(updateStockSettingsAction, initialState);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Almacén</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2 pr-4">Mínimo</th>
              <th className="py-2 pr-4">Máximo</th>
            </tr>
          </thead>
          <tbody>
            {product.stockBalances.map((balance) => (
              <tr key={balance.warehouseName} className="border-b">
                <td className="py-3 pr-4">{balance.warehouseName}</td>
                <td className="py-3 pr-4">{balance.quantity}</td>
                <td className="py-3 pr-4">{balance.minStock}</td>
                <td className="py-3 pr-4">{balance.maxStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {product.stockBalances.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No hay existencias registradas por almacén.
          </p>
        ) : null}
      </div>
      <form action={action} className="grid gap-4 md:grid-cols-4">
        <input type="hidden" name="productId" value={product.id} />
        <div className="md:col-span-4">
          <ActionMessage state={state} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="warehouseId">Almacén</Label>
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
          <Label htmlFor="minStock">Stock mínimo</Label>
          <Input
            id="minStock"
            name="minStock"
            type="number"
            min="0"
            step="0.001"
            required
            defaultValue={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStock">Stock máximo</Label>
          <Input
            id="maxStock"
            name="maxStock"
            type="number"
            min="0"
            step="0.001"
            required
            defaultValue={0}
          />
        </div>
        <div className="md:col-span-4">
          <Button type="submit" disabled={isPending || warehouses.length === 0}>
            {isPending ? "Guardando..." : "Guardar mínimos y máximos"}
          </Button>
        </div>
      </form>
    </div>
  );
}
