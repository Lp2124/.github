import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PosProduct = {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  salePrice: number;
  availableStock: number;
};

export type ActiveShift = {
  id: string;
  openedAt: string;
  openingFloat: number;
  expectedCash: number;
  registerName: string;
  branchName: string;
};

export type SaleSummary = {
  id: string;
  ticketNumber: number;
  total: number;
  status: Database["public"]["Enums"]["sale_status"];
  createdAt: string;
};

export type CashShiftHistory = {
  id: string;
  status: Database["public"]["Enums"]["cash_shift_status"];
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  expectedCash: number;
  countedCash: number | null;
  cashDifference: number | null;
  registerName: string;
  branchName: string;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  sale_price: number;
  product_barcodes: { barcode: string }[] | null;
  inventory_balances: { quantity: number }[] | null;
};

export async function getActiveCashShift() {
  const supabase = await createClient();
  const { data: shiftId } = await supabase.rpc("get_active_cash_shift", {});
  if (!shiftId) return null;
  const { data, error } = await supabase
    .from("cash_shifts")
    .select("id, opened_at, opening_float, expected_cash, cash_registers(name), branches(name)")
    .eq("id", shiftId)
    .single();
  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    opened_at: string;
    opening_float: number;
    expected_cash: number;
    cash_registers: { name: string } | null;
    branches: { name: string } | null;
  };
  return {
    id: row.id,
    openedAt: row.opened_at,
    openingFloat: Number(row.opening_float),
    expectedCash: Number(row.expected_cash),
    registerName: row.cash_registers?.name ?? "Caja no disponible",
    branchName: row.branches?.name ?? "Sucursal no disponible"
  } satisfies ActiveShift;
}

export async function getCashRegisters() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_registers")
    .select("id, name, branches(name)")
    .eq("is_active", true)
    .order("name");
  return (
    (data ?? []) as unknown as { id: string; name: string; branches: { name: string } | null }[]
  ).map((row) => ({ id: row.id, name: `${row.branches?.name ?? "Sucursal"} / ${row.name}` }));
}

export async function getPosWarehouses() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("warehouses")
    .select("id, name, branches(name)")
    .order("name");
  return (
    (data ?? []) as unknown as { id: string; name: string; branches: { name: string } | null }[]
  ).map((row) => ({ id: row.id, name: `${row.branches?.name ?? "Sucursal"} / ${row.name}` }));
}

export async function searchPosProducts(searchTerm: string) {
  const supabase = await createClient();
  const queryText = searchTerm.replaceAll("%", "").replaceAll(",", " ").trim();
  let query = supabase
    .from("products")
    .select("id, sku, name, sale_price, product_barcodes(barcode), inventory_balances(quantity)")
    .eq("is_active", true)
    .order("name")
    .limit(25);

  if (queryText.length > 0) {
    query = query.or(`sku.ilike.%${queryText}%,name.ilike.%${queryText}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("No fue posible buscar productos para POS.");

  return ((data ?? []) as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    barcode: row.product_barcodes?.[0]?.barcode ?? null,
    salePrice: Number(row.sale_price),
    availableStock: (row.inventory_balances ?? []).reduce(
      (total, balance) => total + Number(balance.quantity),
      0
    )
  })) satisfies PosProduct[];
}

export async function getRecentSales() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("id, ticket_number, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    (data ?? []) as unknown as {
      id: string;
      ticket_number: number;
      total: number;
      status: Database["public"]["Enums"]["sale_status"];
      created_at: string;
    }[]
  ).map((sale) => ({
    id: sale.id,
    ticketNumber: sale.ticket_number,
    total: Number(sale.total),
    status: sale.status,
    createdAt: sale.created_at
  })) satisfies SaleSummary[];
}

export async function getCashShiftHistory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cash_shifts")
    .select(
      "id, status, opened_at, closed_at, opening_float, expected_cash, counted_cash, cash_difference, cash_registers(name), branches(name)"
    )
    .order("opened_at", { ascending: false })
    .limit(100);
  return (
    (data ?? []) as unknown as {
      id: string;
      status: Database["public"]["Enums"]["cash_shift_status"];
      opened_at: string;
      closed_at: string | null;
      opening_float: number;
      expected_cash: number;
      counted_cash: number | null;
      cash_difference: number | null;
      cash_registers: { name: string } | null;
      branches: { name: string } | null;
    }[]
  ).map((row) => ({
    id: row.id,
    status: row.status,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    openingFloat: Number(row.opening_float),
    expectedCash: Number(row.expected_cash),
    countedCash: row.counted_cash === null ? null : Number(row.counted_cash),
    cashDifference: row.cash_difference === null ? null : Number(row.cash_difference),
    registerName: row.cash_registers?.name ?? "Caja no disponible",
    branchName: row.branches?.name ?? "Sucursal no disponible"
  })) satisfies CashShiftHistory[];
}
