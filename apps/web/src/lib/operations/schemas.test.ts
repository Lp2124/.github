import { describe, expect, it } from 'vitest';
import { completeSaleSchema, inventoryAdjustmentSchema, productSchema } from './schemas';

describe('operational schemas', () => {
  it('validates product catalog data', () => {
    expect(productSchema.safeParse({ sku: 'MART-16', name: 'Martillo 16oz', unit: 'pieza', sale_price: '150.50', cost: '90', low_stock_threshold: '3', is_active: 'on' }).success).toBe(true);
    expect(productSchema.safeParse({ sku: 'bad sku!', name: 'x', unit: '', sale_price: '-1', cost: '0', low_stock_threshold: '0' }).success).toBe(false);
  });

  it('rejects zero inventory movements and supports negative corrections', () => {
    expect(inventoryAdjustmentSchema.safeParse({ product_id: '00000000-0000-4000-8000-000000000001', movement_type: 'adjustment', quantity_delta: '0', reason: 'Conteo físico' }).success).toBe(false);
    expect(inventoryAdjustmentSchema.safeParse({ product_id: '00000000-0000-4000-8000-000000000001', movement_type: 'correction', quantity_delta: '-2', reason: 'Corrección por conteo físico' }).success).toBe(true);
  });

  it('requires sale items with positive quantities', () => {
    expect(completeSaleSchema.safeParse({ customer_id: null, discount_amount: 0, items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 1, unitPrice: 10, discountAmount: 0 }] }).success).toBe(true);
    expect(completeSaleSchema.safeParse({ customer_id: null, discount_amount: 0, items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 0, unitPrice: 10, discountAmount: 0 }] }).success).toBe(false);
  });
});
