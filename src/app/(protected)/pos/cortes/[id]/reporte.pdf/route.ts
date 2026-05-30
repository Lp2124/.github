import { NextResponse } from "next/server";
import { getCashShiftReport } from "@/features/pos/services/ticket-service";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const report = await getCashShiftReport(id);
  if (!report) return new NextResponse("Reporte no encontrado", { status: 404 });
  const lines = [
    "Reporte de corte de caja - Ferretería De La O",
    `Caja: ${report.branches?.name ?? ""} / ${report.cash_registers?.name ?? ""}`,
    `Apertura: ${new Date(report.opened_at).toLocaleString("es-MX")}`,
    `Cierre: ${report.closed_at ? new Date(report.closed_at).toLocaleString("es-MX") : "Abierta"}`,
    `Fondo inicial: $${Number(report.opening_float).toFixed(2)}`,
    `Efectivo esperado: $${Number(report.expected_cash).toFixed(2)}`,
    `Efectivo contado: ${report.counted_cash === null ? "" : `$${Number(report.counted_cash).toFixed(2)}`}`,
    `Diferencia: ${report.cash_difference === null ? "" : `$${Number(report.cash_difference).toFixed(2)}`}`,
    "Ventas:",
    ...report.sales.map(
      (sale) => `Ticket ${sale.ticket_number} ${sale.status} $${Number(sale.total).toFixed(2)}`
    ),
    "Movimientos de efectivo:",
    ...report.cash_shift_movements.map(
      (movement) =>
        `${movement.movement_type} $${Number(movement.amount).toFixed(2)} ${movement.reason}`
    )
  ];
  const escaped = lines
    .map(
      (line, index) =>
        `BT /F1 10 Tf 40 ${760 - index * 16} Td (${line.replace(/[()\\]/g, "")}) Tj ET`
    )
    .join("\n");
  const body = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length ${escaped.length} >> stream\n${escaped}\nendstream endobj\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="corte-${id}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
