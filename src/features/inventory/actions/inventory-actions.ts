"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import {
  brandSchema,
  categorySchema,
  movementSchema,
  productSchema,
  stockSettingsSchema,
  supplierSchema
} from "@/features/inventory/schemas/inventory-schemas";

export type InventoryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const success = (message: string): InventoryActionState => ({ status: "success", message });
const failure = (message: string): InventoryActionState => ({ status: "error", message });

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function productPayload(formData: FormData) {
  return {
    companyId: formData.get("companyId"),
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    brandId: formData.get("brandId"),
    supplierId: formData.get("supplierId"),
    barcode: formData.get("barcode"),
    imageUrl: formData.get("imageUrl"),
    imageAltText: formData.get("imageAltText"),
    unitOfMeasure: formData.get("unitOfMeasure"),
    costPrice: formData.get("costPrice"),
    salePrice: formData.get("salePrice"),
    trackInventory: formData.get("trackInventory")
  };
}

export async function createProductAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = productSchema.safeParse(productPayload(formData));

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Datos inválidos para producto.");
  }

  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      company_id: parsed.data.companyId,
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      brand_id: parsed.data.brandId,
      supplier_id: parsed.data.supplierId,
      unit_of_measure: parsed.data.unitOfMeasure,
      cost_price: parsed.data.costPrice,
      sale_price: parsed.data.salePrice,
      track_inventory: parsed.data.trackInventory
    })
    .select("id")
    .single();

  if (productError || !product) {
    logger.warn("inventory.product.create_failed", { errorCode: productError?.code ?? null });
    return failure("No fue posible crear el producto. Verifica SKU único y permisos.");
  }

  const productId = product.id;

  try {
    await saveProductChildren({
      productId,
      companyId: parsed.data.companyId,
      barcode: parsed.data.barcode,
      imageUrl: parsed.data.imageUrl,
      imageAltText: parsed.data.imageAltText ?? parsed.data.name
    });
  } catch (error) {
    await supabase.from("products").update({ is_active: false }).eq("id", productId);
    logger.error("inventory.product.children_create_failed", {
      productId,
      errorName: error instanceof Error ? error.name : "unknown"
    });
    return failure(
      "El producto no pudo completarse con código de barras o imagen. No quedó activo."
    );
  }

  logger.info("inventory.product.created", { productId });
  revalidatePath("/inventario");
  redirect(`/inventario/productos/${productId}/editar`);
}

export async function updateProductAction(
  productId: string,
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = productSchema.safeParse(productPayload(formData));

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Datos inválidos para producto.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      company_id: parsed.data.companyId,
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
      brand_id: parsed.data.brandId,
      supplier_id: parsed.data.supplierId,
      unit_of_measure: parsed.data.unitOfMeasure,
      cost_price: parsed.data.costPrice,
      sale_price: parsed.data.salePrice,
      track_inventory: parsed.data.trackInventory
    })
    .eq("id", productId);

  if (error) {
    logger.warn("inventory.product.update_failed", { productId, errorCode: error.code ?? null });
    return failure("No fue posible actualizar el producto. Verifica SKU único y permisos.");
  }

  try {
    await saveProductChildren({
      productId,
      companyId: parsed.data.companyId,
      barcode: parsed.data.barcode,
      imageUrl: parsed.data.imageUrl,
      imageAltText: parsed.data.imageAltText ?? parsed.data.name
    });
  } catch (childError) {
    logger.warn("inventory.product.children_update_failed", {
      productId,
      errorName: childError instanceof Error ? childError.name : "unknown"
    });
    return failure("Producto actualizado, pero no fue posible guardar código de barras o imagen.");
  }

  logger.info("inventory.product.updated", { productId });
  revalidatePath("/inventario");
  revalidatePath(`/inventario/productos/${productId}/editar`);
  return success("Producto actualizado correctamente.");
}

export async function deactivateProductAction(productId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", productId);

  if (error) {
    logger.warn("inventory.product.deactivate_failed", {
      productId,
      errorCode: error.code ?? null
    });
    redirect(`/inventario/productos/${productId}/editar?error=deactivate`);
  }

  logger.info("inventory.product.deactivated", { productId });
  revalidatePath("/inventario");
  redirect("/inventario");
}

async function saveProductChildren(input: {
  productId: string;
  companyId: string;
  barcode: string | null;
  imageUrl: string | null;
  imageAltText: string;
}) {
  const supabase = await createClient();
  await supabase.from("product_barcodes").delete().eq("product_id", input.productId);
  await supabase.from("product_images").delete().eq("product_id", input.productId);

  if (input.barcode) {
    const { error } = await supabase
      .from("product_barcodes")
      .insert({ company_id: input.companyId, product_id: input.productId, barcode: input.barcode });
    if (error) throw error;
  }

  if (input.imageUrl) {
    const { error } = await supabase.from("product_images").insert({
      product_id: input.productId,
      image_url: input.imageUrl,
      alt_text: input.imageAltText
    });
    if (error) throw error;
  }
}

export async function createCategoryAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = categorySchema.safeParse({
    companyId: formData.get("companyId"),
    parentId: formData.get("parentId"),
    name: formData.get("name"),
    slug: formData.get("slug")
  });

  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Categoría inválida.");

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    company_id: parsed.data.companyId,
    parent_id: parsed.data.parentId,
    name: parsed.data.name,
    slug: parsed.data.slug
  });
  if (error) return failure("No fue posible crear la categoría. Verifica slug único y permisos.");
  revalidatePath("/inventario/catalogos");
  return success("Categoría creada correctamente.");
}

export async function createBrandAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = brandSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    slug: formData.get("slug")
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Marca inválida.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("brands")
    .insert({ company_id: parsed.data.companyId, name: parsed.data.name, slug: parsed.data.slug });
  if (error) return failure("No fue posible crear la marca. Verifica slug único y permisos.");
  revalidatePath("/inventario/catalogos");
  return success("Marca creada correctamente.");
}

export async function createSupplierAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = supplierSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone")
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Proveedor inválido.");
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    company_id: parsed.data.companyId,
    name: parsed.data.name,
    tax_id: parsed.data.taxId,
    contact_name: parsed.data.contactName,
    email: parsed.data.email,
    phone: parsed.data.phone
  });
  if (error) return failure("No fue posible crear el proveedor. Verifica nombre único y permisos.");
  revalidatePath("/inventario/catalogos");
  return success("Proveedor creado correctamente.");
}

export async function updateStockSettingsAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = stockSettingsSchema.safeParse({
    productId: formData.get("productId"),
    warehouseId: formData.get("warehouseId"),
    minStock: formData.get("minStock"),
    maxStock: formData.get("maxStock")
  });

  if (!parsed.success)
    return failure(parsed.error.issues[0]?.message ?? "Configuración de stock inválida.");

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_balances").upsert(
    {
      product_id: parsed.data.productId,
      warehouse_id: parsed.data.warehouseId,
      min_stock: parsed.data.minStock,
      max_stock: parsed.data.maxStock
    },
    { onConflict: "warehouse_id,product_id" }
  );

  if (error) return failure("No fue posible actualizar mínimos y máximos de stock.");
  revalidatePath("/inventario");
  return success("Stock mínimo y máximo actualizados.");
}

export async function registerMovementAction(
  _state: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const parsed = movementSchema.safeParse({
    productId: formData.get("productId"),
    warehouseId: formData.get("warehouseId"),
    destinationWarehouseId: formData.get("destinationWarehouseId"),
    movementType: formData.get("movementType"),
    quantity: formData.get("quantity"),
    adjustmentDirection: optionalString(formData.get("adjustmentDirection")) ?? undefined,
    reason: formData.get("reason"),
    referenceDocument: formData.get("referenceDocument")
  });

  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Movimiento inválido.");

  let quantityDelta = parsed.data.quantity;
  if (parsed.data.movementType === "salida" || parsed.data.movementType === "merma")
    quantityDelta = -parsed.data.quantity;
  if (parsed.data.movementType === "ajuste" && parsed.data.adjustmentDirection === "decrease")
    quantityDelta = -parsed.data.quantity;

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_inventory_movement", {
    p_product_id: parsed.data.productId,
    p_warehouse_id: parsed.data.warehouseId,
    p_movement_type: parsed.data.movementType,
    p_quantity_delta: quantityDelta,
    p_reason: parsed.data.reason,
    p_reference_document: parsed.data.referenceDocument,
    p_destination_warehouse_id: parsed.data.destinationWarehouseId
  });

  if (error) {
    logger.warn("inventory.movement.register_failed", {
      errorCode: error.code ?? null,
      movementType: parsed.data.movementType
    });
    return failure(
      "No fue posible registrar el movimiento. Verifica permisos, stock disponible y almacenes."
    );
  }

  revalidatePath("/inventario");
  revalidatePath("/inventario/movimientos");
  return success("Movimiento registrado correctamente.");
}
