import Link from "next/link";
import { CashMovementForm, CloseShiftForm, OpenShiftForm } from "@/components/pos/cash-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCashShift, getCashRegisters } from "@/features/pos/services/pos-service";

export default async function CashPage() {
  const [shift, registers] = await Promise.all([getActiveCashShift(), getCashRegisters()]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">Apertura, movimientos y cierre.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pos">Volver al POS</Link>
        </Button>
      </div>
      {shift ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Caja activa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                {shift.branchName} / {shift.registerName}
              </p>
              <p>Fondo inicial: ${shift.openingFloat.toFixed(2)}</p>
              <p>Efectivo esperado: ${shift.expectedCash.toFixed(2)}</p>
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <CashMovementForm shift={shift} />
            <CloseShiftForm shift={shift} />
          </div>
        </>
      ) : (
        <OpenShiftForm registers={registers} />
      )}
    </div>
  );
}
