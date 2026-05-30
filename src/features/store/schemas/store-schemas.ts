import { z } from "zod";

const uuidSchema = z.string().uuid();
export const cartItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.coerce.number().positive().max(999999)
});
export const customerProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(180),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(32).nullable()
  )
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(1).max(180),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(32).nullable()
  ),
  items: z.array(cartItemSchema).min(1)
});
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
