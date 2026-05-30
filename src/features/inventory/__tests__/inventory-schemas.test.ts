import { describe, expect, it } from "vitest";
import {
  movementSchema,
  productSchema,
  stockSettingsSchema
} from "@/features/inventory/schemas/inventory-schemas";

const validProduct = {
  companyId: "00000000-0000-4000-8000-000000000001",
  sku: "SKU-001",
  name: "Producto operativo",
  description: "Producto validado por pruebas",
  categoryId: "",
  brandId: "",
  supplierId: "",
  barcode: "7501234567890",
  imageUrl: "https://example.com/product.png",
  imageAltText: "Producto operativo",
  unitOfMeasure: "pieza",
  costPrice: "10.50",
  salePrice: "15.00",
  trackInventory: "on"
};

describe("inventory schemas", () => {
  it("accepts a complete product payload", () => {
    const result = productSchema.safeParse(validProduct);

    expect(result.success).toBe(true);
  });

  it("rejects invalid SKU and non-HTTPS image URLs", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      sku: "SKU inválido",
      imageUrl: "http://example.com/product.png"
    });

    expect(result.success).toBe(false);
  });

  it("validates stock minimum and maximum relationship", () => {
    const result = stockSettingsSchema.safeParse({
      productId: "00000000-0000-4000-8000-000000000002",
      warehouseId: "00000000-0000-4000-8000-000000000003",
      minStock: "10",
      maxStock: "5"
    });

    expect(result.success).toBe(false);
  });

  it("requires positive movement quantity and auditable reason", () => {
    const result = movementSchema.safeParse({
      productId: "00000000-0000-4000-8000-000000000002",
      warehouseId: "00000000-0000-4000-8000-000000000003",
      destinationWarehouseId: "",
      movementType: "entrada",
      quantity: "3",
      adjustmentDirection: "increase",
      reason: "Compra recibida",
      referenceDocument: "OC-1"
    });

    expect(result.success).toBe(true);
  });
});
