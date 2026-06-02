import { describe, expect, it } from 'vitest';
import { productFormSchema, productSearchSchema } from './schema';

const validProduct = {
  categoryId: '',
  categoryName: '',
  sku: 'MART-16',
  name: 'Martillo 16 oz',
  description: '',
  unit: 'pieza',
  salePrice: '150.50',
  costPrice: '90.10',
  isActive: 'on',
};

describe('product schemas', () => {
  it('validates product form data and normalizes optional fields', () => {
    const parsed = productFormSchema.safeParse(validProduct);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sku).toBe('MART-16');
      expect(parsed.data.description).toBeNull();
      expect(parsed.data.salePrice).toBe(150.5);
      expect(parsed.data.costPrice).toBe(90.1);
      expect(parsed.data.isActive).toBe(true);
    }
  });

  it('rejects invalid product prices and ambiguous categories', () => {
    expect(productFormSchema.safeParse({ ...validProduct, salePrice: '-1' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...validProduct, categoryId: '00000000-0000-4000-8000-000000000001', categoryName: 'Herramientas' }).success).toBe(false);
  });

  it('sanitizes unsafe search text', () => {
    expect(productSearchSchema.parse('MART-16')).toBe('MART-16');
    expect(productSearchSchema.parse('bad,query()')).toBe('');
  });
});
