import { createClient } from "@/lib/supabase/server";

export async function getSaleTicket(saleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select(
      "id, ticket_number, total, subtotal, discount_total, status, created_at, sale_lines(sku, product_name, quantity, unit_price, discount_amount, line_total), sale_payments(payment_method, amount, reference)"
    )
    .eq("id", saleId)
    .single();
  if (error || !data) return null;
  return data as unknown as {
    id: string;
    ticket_number: number;
    total: number;
    subtotal: number;
    discount_total: number;
    status: string;
    created_at: string;
    sale_lines: {
      sku: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      discount_amount: number;
      line_total: number;
    }[];
    sale_payments: { payment_method: string; amount: number; reference: string | null }[];
  };
}

export async function getCashShiftReport(shiftId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_shifts")
    .select(
      "id, opened_at, closed_at, opening_float, expected_cash, counted_cash, cash_difference, closing_notes, cash_registers(name), branches(name), sales(ticket_number, total, status, created_at), cash_shift_movements(movement_type, amount, reason, created_at)"
    )
    .eq("id", shiftId)
    .single();
  if (error || !data) return null;
  return data as unknown as {
    id: string;
    opened_at: string;
    closed_at: string | null;
    opening_float: number;
    expected_cash: number;
    counted_cash: number | null;
    cash_difference: number | null;
    closing_notes: string | null;
    cash_registers: { name: string } | null;
    branches: { name: string } | null;
    sales: { ticket_number: number; total: number; status: string; created_at: string }[];
    cash_shift_movements: {
      movement_type: string;
      amount: number;
      reason: string;
      created_at: string;
    }[];
  };
}
