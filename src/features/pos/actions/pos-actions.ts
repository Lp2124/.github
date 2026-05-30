"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import {
  cashMovementSchema,
  closeShiftSchema,
  createSaleSchema,
  openShiftSchema,
  saleReasonSchema
} from "@/features/pos/schemas/pos-schemas";

export type PosActionState = {
  status: "idle" | "success" | "error";
  message: string;
  saleId?: string;
};
const ok = (message: string, saleId?: string): PosActionState =>
  saleId ? { status: "success", message, saleId } : { status: "success", message };
const fail = (message: string): PosActionState => ({ status: "error", message });

export async function openCashShiftAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const parsed = openShiftSchema.safeParse({
    cashRegisterId: formData.get("cashRegisterId"),
    openingFloat: formData.get("openingFloat")
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos para apertura.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("open_cash_shift", {
    p_cash_register_id: parsed.data.cashRegisterId,
    p_opening_float: parsed.data.openingFloat
  });
  if (error) {
    logger.warn("pos.cash_shift.open_failed", { errorCode: error.code ?? null });
    return fail("No fue posible abrir caja. Verifica permisos y que no exista una caja abierta.");
  }
  revalidatePath("/pos");
  revalidatePath("/pos/caja");
  return ok("Caja abierta correctamente.");
}

export async function createSaleAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const rawItems = String(formData.get("items") ?? "[]");
  const rawPayments = String(formData.get("payments") ?? "[]");
  let items: unknown;
  let payments: unknown;
  try {
    items = JSON.parse(rawItems);
    payments = JSON.parse(rawPayments);
  } catch {
    return fail("El carrito o los pagos no tienen un formato válido.");
  }
  const parsed = createSaleSchema.safeParse({
    warehouseId: formData.get("warehouseId"),
    discountTotal: formData.get("discountTotal"),
    items,
    payments
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Venta inválida.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pos_sale", {
    p_warehouse_id: parsed.data.warehouseId,
    p_items: parsed.data.items,
    p_payments: parsed.data.payments,
    p_discount_total: parsed.data.discountTotal
  });
  if (error || !data) {
    logger.warn("pos.sale.create_failed", { errorCode: error?.code ?? null });
    return fail(
      "No fue posible completar la venta. Verifica caja abierta, pagos, permisos e inventario."
    );
  }
  revalidatePath("/pos");
  revalidatePath("/pos/caja");
  return ok("Venta completada correctamente.", data);
}

export async function recordCashMovementAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const parsed = cashMovementSchema.safeParse({
    cashShiftId: formData.get("cashShiftId"),
    movementType: formData.get("movementType"),
    amount: formData.get("amount"),
    reason: formData.get("reason")
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "Movimiento de efectivo inválido.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_cash_shift_movement", {
    p_cash_shift_id: parsed.data.cashShiftId,
    p_movement_type: parsed.data.movementType,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason
  });
  if (error) return fail("No fue posible registrar el movimiento de efectivo.");
  revalidatePath("/pos/caja");
  return ok("Movimiento de efectivo registrado.");
}

export async function closeCashShiftAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const parsed = closeShiftSchema.safeParse({
    cashShiftId: formData.get("cashShiftId"),
    countedCash: formData.get("countedCash"),
    closingNotes: String(formData.get("closingNotes") ?? "").trim() || null
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Cierre de caja inválido.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_cash_shift", {
    p_cash_shift_id: parsed.data.cashShiftId,
    p_counted_cash: parsed.data.countedCash,
    p_closing_notes: parsed.data.closingNotes
  });
  if (error) return fail("No fue posible cerrar la caja.");
  revalidatePath("/pos");
  revalidatePath("/pos/caja");
  return ok("Caja cerrada correctamente.");
}

export async function voidSaleAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const parsed = saleReasonSchema.safeParse({
    saleId: formData.get("saleId"),
    reason: formData.get("reason")
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Cancelación inválida.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_pos_sale", {
    p_sale_id: parsed.data.saleId,
    p_reason: parsed.data.reason
  });
  if (error) return fail("No fue posible cancelar la venta. Verifica permisos.");
  revalidatePath("/pos/historial");
  return ok("Venta cancelada correctamente.");
}

export async function returnSaleAction(
  _state: PosActionState,
  formData: FormData
): Promise<PosActionState> {
  const parsed = saleReasonSchema.safeParse({
    saleId: formData.get("saleId"),
    reason: formData.get("reason")
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Devolución inválida.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("return_pos_sale", {
    p_sale_id: parsed.data.saleId,
    p_reason: parsed.data.reason
  });
  if (error) return fail("No fue posible procesar la devolución. Verifica permisos.");
  revalidatePath("/pos/historial");
  return ok("Devolución procesada correctamente.");
}

export async function redirectToSaleTicket(saleId: string) {
  redirect(`/pos/ventas/${saleId}`);
}
