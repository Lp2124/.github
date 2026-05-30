import { z } from "zod";

const uuidSchema = z.string().uuid("Selecciona un registro válido.");
const moneySchema = z.coerce.number().min(0).max(999999999);
const positiveMoneySchema = z.coerce.number().positive().max(999999999);
const reasonSchema = z.string().trim().min(3).max(500);

export const openShiftSchema = z.object({
  cashRegisterId: uuidSchema,
  openingFloat: moneySchema
});

export const cashMovementSchema = z.object({
  cashShiftId: uuidSchema,
  movementType: z.enum(["entrada", "salida"]),
  amount: positiveMoneySchema,
  reason: reasonSchema
});

export const closeShiftSchema = z.object({
  cashShiftId: uuidSchema,
  countedCash: moneySchema,
  closingNotes: z.string().trim().max(1000).nullable()
});

export const posCartItemSchema = z.object({
  product_id: uuidSchema,
  quantity: z.coerce.number().positive().max(999999999),
  unit_price: moneySchema,
  discount_amount: moneySchema.default(0)
});

export const posPaymentSchema = z.object({
  payment_method: z.enum(["efectivo", "tarjeta", "transferencia"]),
  amount: positiveMoneySchema,
  reference: z.string().trim().max(120).nullable().optional()
});

export const createSaleSchema = z.object({
  warehouseId: uuidSchema,
  discountTotal: moneySchema.default(0),
  items: z.array(posCartItemSchema).min(1),
  payments: z.array(posPaymentSchema).min(1)
});

export const saleReasonSchema = z.object({
  saleId: uuidSchema,
  reason: reasonSchema
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
