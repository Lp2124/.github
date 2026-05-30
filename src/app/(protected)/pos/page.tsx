import Link from "next/link";
import { PosSaleForm } from "@/components/pos/pos-sale-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getActiveCashShift,
  getPosWarehouses,
  searchPosProducts
} from "@/features/pos/services/pos-service";

export default async function PosPage() {
  const [shift, warehouses, products] = await Promise.all([
    getActiveCashShift(),
    getPosWarehouses(),
    searchPosProducts("")
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Punto de venta</h1>
          <p className="text-muted-foreground">Venta de mostrador conectada a inventario y caja.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/pos/caja">Caja</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pos/historial">Historial</Link>
          </Button>
        </div>
      </div>
      {!shift ? (
        <Card>
          <CardHeader>
            <CardTitle>Caja requerida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Debes abrir caja antes de vender.</p>
            <Button asChild>
              <Link href="/pos/caja">Abrir caja</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm">
            Caja activa: {shift.branchName} / {shift.registerName}. Efectivo esperado: $
            {shift.expectedCash.toFixed(2)}
          </CardContent>
        </Card>
      )}
      <PosSaleForm products={products} warehouses={warehouses} hasActiveShift={Boolean(shift)} />
    </div>
  );
}
