import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCashShiftHistory, getRecentSales } from "@/features/pos/services/pos-service";

export default async function PosHistoryPage() {
  const [sales, shifts] = await Promise.all([getRecentSales(), getCashShiftHistory()]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial POS</h1>
          <p className="text-muted-foreground">Ventas y cortes por fecha y cajero según RLS.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pos">Volver al POS</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ventas recientes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Ticket</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b">
                  <td className="py-3 pr-4">{sale.ticketNumber}</td>
                  <td className="py-3 pr-4">{new Date(sale.createdAt).toLocaleString("es-MX")}</td>
                  <td className="py-3 pr-4">{sale.status}</td>
                  <td className="py-3 pr-4">${sale.total.toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    <Link className="text-primary underline" href={`/pos/ventas/${sale.id}`}>
                      Ticket
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cortes de caja</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Caja</th>
                <th className="py-2 pr-4">Apertura</th>
                <th className="py-2 pr-4">Cierre</th>
                <th className="py-2 pr-4">Esperado</th>
                <th className="py-2 pr-4">Contado</th>
                <th className="py-2 pr-4">Diferencia</th>
                <th className="py-2 pr-4">PDF</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="border-b">
                  <td className="py-3 pr-4">
                    {shift.branchName} / {shift.registerName}
                  </td>
                  <td className="py-3 pr-4">{new Date(shift.openedAt).toLocaleString("es-MX")}</td>
                  <td className="py-3 pr-4">
                    {shift.closedAt ? new Date(shift.closedAt).toLocaleString("es-MX") : "Abierta"}
                  </td>
                  <td className="py-3 pr-4">${shift.expectedCash.toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    {shift.countedCash === null ? "" : `$${shift.countedCash.toFixed(2)}`}
                  </td>
                  <td className="py-3 pr-4">
                    {shift.cashDifference === null ? "" : `$${shift.cashDifference.toFixed(2)}`}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      className="text-primary underline"
                      href={`/pos/cortes/${shift.id}/reporte.pdf`}
                    >
                      Reporte
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
