import Link from "next/link";
import { MovementForm } from "@/components/inventory/movement-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInventoryMovements,
  getInventoryOptions,
  getProducts
} from "@/features/inventory/services/inventory-service";

export default async function MovementsPage() {
  const [products, movements, options] = await Promise.all([
    getProducts({}),
    getInventoryMovements(),
    getInventoryOptions()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de inventario</h1>
          <p className="text-muted-foreground">
            Entrada, salida, ajuste, merma, devolución y traspaso con historial auditable.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventario">Volver a inventario</Link>
        </Button>
      </div>
      <MovementForm products={products} warehouses={options.warehouses} />
      <Card>
        <CardHeader>
          <CardTitle>Historial auditable</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4">Almacén</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Cantidad</th>
                <th className="py-2 pr-4">Anterior</th>
                <th className="py-2 pr-4">Nuevo</th>
                <th className="py-2 pr-4">Motivo</th>
                <th className="py-2 pr-4">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b">
                  <td className="py-3 pr-4">
                    {new Date(movement.occurredAt).toLocaleString("es-MX")}
                  </td>
                  <td className="py-3 pr-4 font-medium">{movement.sku}</td>
                  <td className="py-3 pr-4">{movement.productName}</td>
                  <td className="py-3 pr-4">{movement.warehouseName}</td>
                  <td className="py-3 pr-4">{movement.movementType}</td>
                  <td className="py-3 pr-4">{movement.quantityDelta}</td>
                  <td className="py-3 pr-4">{movement.previousQuantity}</td>
                  <td className="py-3 pr-4">{movement.newQuantity}</td>
                  <td className="py-3 pr-4">{movement.reason}</td>
                  <td className="py-3 pr-4">{movement.referenceDocument ?? "Sin referencia"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No hay movimientos visibles.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
