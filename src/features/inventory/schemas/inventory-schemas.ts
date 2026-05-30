import { z } from "zod";

const uuidSchema = z.string().uuid("Selecciona un registro válido.");
const optionalUuidSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().uuid().nullable()
);
const trimmedText = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalTrimmedText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable()
  );

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones medios.")
  .max(160);

export const productSchema = z.object({
  companyId: uuidSchema,
  sku: trimmedText(1, 64).regex(
    /^[A-Za-z0-9._-]+$/,
    "El SKU solo permite letras, números, punto, guion y guion bajo."
  ),
  name: trimmedText(1, 240),
  description: optionalTrimmedText(2000),
  categoryId: optionalUuidSchema,
  brandId: optionalUuidSchema,
  supplierId: optionalUuidSchema,
  barcode: optionalTrimmedText(64).refine(
    (value) => value === null || /^[A-Za-z0-9._-]{4,64}$/.test(value),
    {
      message: "El código de barras debe tener entre 4 y 64 caracteres alfanuméricos válidos."
    }
  ),
  imageUrl: optionalTrimmedText(2048).refine(
    (value) => value === null || value.startsWith("https://"),
    {
      message: "La imagen debe usar HTTPS."
    }
  ),
  imageAltText: optionalTrimmedText(180),
  unitOfMeasure: trimmedText(1, 40),
  costPrice: z.coerce.number().min(0).max(999999999),
  salePrice: z.coerce.number().min(0).max(999999999),
  trackInventory: z.preprocess((value) => value === "on" || value === true, z.boolean())
});

export const categorySchema = z.object({
  companyId: uuidSchema,
  parentId: optionalUuidSchema,
  name: trimmedText(1, 160),
  slug: slugSchema
});

export const brandSchema = z.object({
  companyId: uuidSchema,
  name: trimmedText(1, 120),
  slug: slugSchema
});

export const supplierSchema = z.object({
  companyId: uuidSchema,
  name: trimmedText(1, 180),
  taxId: optionalTrimmedText(13).refine(
    (value) => value === null || /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(value),
    {
      message: "El RFC del proveedor no tiene un formato válido."
    }
  ),
  contactName: optionalTrimmedText(160),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().email().max(320).nullable()
  ),
  phone: optionalTrimmedText(32).refine(
    (value) => value === null || /^[0-9 +().-]{7,32}$/.test(value),
    {
      message: "El teléfono solo permite números, espacios y símbolos telefónicos comunes."
    }
  )
});

export const stockSettingsSchema = z
  .object({
    productId: uuidSchema,
    warehouseId: uuidSchema,
    minStock: z.coerce.number().min(0).max(999999999),
    maxStock: z.coerce.number().min(0).max(999999999)
  })
  .refine((value) => value.maxStock === 0 || value.maxStock >= value.minStock, {
    path: ["maxStock"],
    message: "El stock máximo debe ser cero o mayor/igual al mínimo."
  });

export const movementSchema = z.object({
  productId: uuidSchema,
  warehouseId: uuidSchema,
  destinationWarehouseId: optionalUuidSchema,
  movementType: z.enum(["entrada", "salida", "ajuste", "merma", "devolucion", "traspaso"]),
  quantity: z.coerce.number().positive().max(999999999),
  adjustmentDirection: z.enum(["increase", "decrease"]).optional(),
  reason: trimmedText(3, 500),
  referenceDocument: optionalTrimmedText(120)
});

export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type StockSettingsInput = z.infer<typeof stockSettingsSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
