import { z } from 'zod';

export const moneySchema = z.coerce.number().finite().min(0).max(99999999).transform((value) => Math.round(value * 100) / 100);
export const quantitySchema = z.coerce.number().finite().positive().max(999999).transform((value) => Math.round(value * 1000) / 1000);
export const optionalUuidSchema = z.union([z.string().uuid(), z.literal(''), z.null(), z.undefined()]).optional().transform((value) => value || null);

export const productSchema = z.object({
  sku: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/, 'SKU inválido.'),
  barcode: z.string().trim().max(64).optional().transform((value) => value || null),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  category_id: optionalUuidSchema,
  unit: z.string().trim().min(1).max(24),
  sale_price: moneySchema,
  cost: moneySchema,
  low_stock_threshold: z.coerce.number().int().min(0).max(999999),
  is_active: z.union([z.literal('on'), z.literal('true'), z.literal(true), z.literal('')]).optional().transform((value) => value === 'on' || value === 'true' || value === true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  movement_type: z.enum(['initial', 'purchase', 'adjustment', 'return', 'correction']),
  quantity_delta: z.coerce.number().finite().min(-999999).max(999999).refine((value) => value !== 0, 'La cantidad no puede ser cero.'),
  reason: z.string().trim().min(5).max(240),
  reference: z.string().trim().max(120).optional().transform((value) => value || null),
});

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: quantitySchema,
  unitPrice: moneySchema,
  discountAmount: moneySchema,
});

export const completeSaleSchema = z.object({
  customer_id: optionalUuidSchema,
  discount_amount: moneySchema,
  items: z.array(saleItemSchema).min(1).max(100),
});

export const cashOpenSchema = z.object({
  opening_amount: moneySchema,
  notes: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const cashMovementSchema = z.object({
  movement_type: z.enum(['cash_in', 'cash_out']),
  amount: moneySchema.refine((value) => value > 0, 'El monto debe ser mayor a cero.'),
  reason: z.string().trim().min(5).max(240),
});

export const cashCloseSchema = z.object({
  counted_amount: moneySchema,
  notes: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(180),
  phone: z.string().trim().max(40).optional().transform((value) => value || null),
  email: z.union([z.string().email(), z.literal(''), z.null(), z.undefined()]).transform((value) => value || null),
  rfc: z.string().trim().max(20).optional().transform((value) => value || null),
  notes: z.string().trim().max(1000).optional().transform((value) => value || null),
  is_active: z.union([z.literal('on'), z.literal('true'), z.literal(true), z.literal('')]).optional().transform((value) => value === 'on' || value === 'true' || value === true),
});

export function parseJsonFormField<T>(value: FormDataEntryValue | null, schema: z.ZodType<T>) {
  if (typeof value !== 'string') return { success: false as const, error: 'Payload inválido.' };
  try {
    return schema.safeParse(JSON.parse(value));
  } catch {
    return { success: false as const, error: 'Payload JSON inválido.' };
  }
}
