import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSaleTicket } from "@/features/pos/services/ticket-service";

type TicketPageProps = { params: Promise<{ id: string }> };

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const ticket = await getSaleTicket(id);
  if (!ticket) notFound();
  return (
    <Card className="mx-auto max-w-2xl print:shadow-none">
      <CardHeader>
        <CardTitle>Ticket #{ticket.ticket_number}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {new Date(ticket.created_at).toLocaleString("es-MX")} / Estado: {ticket.status}
        </p>
        <table className="w-full text-sm">
          <tbody>
            {ticket.sale_lines.map((line) => (
              <tr key={`${line.sku}-${line.product_name}`} className="border-b">
                <td className="py-2">
                  {line.quantity} x {line.product_name}
                </td>
                <td className="py-2 text-right">${Number(line.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-sm">
          <p>Subtotal: ${Number(ticket.subtotal).toFixed(2)}</p>
          <p>Descuento: ${Number(ticket.discount_total).toFixed(2)}</p>
          <p className="text-lg font-bold">Total: ${Number(ticket.total).toFixed(2)}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Pagos</p>
          {ticket.sale_payments.map((payment) => (
            <p key={`${payment.payment_method}-${payment.amount}`}>
              {payment.payment_method}: ${Number(payment.amount).toFixed(2)}{" "}
              {payment.reference ?? ""}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
