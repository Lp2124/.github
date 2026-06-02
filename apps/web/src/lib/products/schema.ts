import { z } from 'zod';

const safeCatalogTextPattern = /^[\p{L}\p{N}\s._/#-]+$/u;
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const optionalCatalogText = (max: number) => optionalText(max).refine((value) => value === null || safeCatalogTextPattern.test(value), {
  message: 'Solo se permiten letras, números, espacios y . _ / # -.',
});

export const productSearchSchema = z.string().trim().max(80).regex(/^[\p{L}\p{N}\s._/#-]*$/u).catch('');

export const productFormSchema = z.object({
  productId: z.string().uuid().optional(),
  categoryId: z.union([z.string().uuid(), z.literal('')]).transform((value) => value || null),
  categoryName: optionalCatalogText(120),
  sku: optionalCatalogText(80),
  name: z.string().trim().min(2).max(180),
  description: optionalText(2000),
  unit: z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N}\s._/-]+$/u),
  salePrice: z.coerce.number().finite().min(0).max(9999999999).transform((value) => Math.round(value * 100) / 100),
  costPrice: z.union([z.literal(''), z.coerce.number().finite().min(0).max(9999999999)]).transform((value) => {
    if (value === '') return null;
    return Math.round(value * 100) / 100;
  }),
  isActive: z.union([z.literal('on'), z.literal('true'), z.literal('false'), z.null()]).transform((value) => value === 'on' || value === 'true'),
}).superRefine((value, context) => {
  if (value.categoryName && value.categoryName.length < 2) {
    context.addIssue({ code: 'custom', path: ['categoryName'], message: 'La categoría debe tener al menos 2 caracteres.' });
  }

  if (value.categoryId && value.categoryName) {
    context.addIssue({ code: 'custom', path: ['categoryName'], message: 'Selecciona una categoría existente o escribe una nueva, no ambas.' });
  }
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
