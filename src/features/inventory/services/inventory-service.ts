import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type MovementType = Database["public"]["Enums"]["inventory_movement_type"];

export type SelectOption = { id: string; name: string };
export type CompanyOption = SelectOption;
export type WarehouseOption = SelectOption & { branchName: string };
export type CategoryOption = SelectOption & { parentId: string | null };

export type ProductStockBalance = {
  warehouseName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
};

export type ProductListItem = {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  categoryName: string | null;
  brandName: string | null;
  supplierName: string | null;
  barcode: string | null;
  imageUrl: string | null;
  totalStock: number;
  minStock: number;
  maxStock: number;
};

export type ProductDetail = ProductListItem & {
  categoryId: string | null;
  brandId: string | null;
  supplierId: string | null;
  imageAltText: string | null;
  trackInventory: boolean;
  stockBalances: ProductStockBalance[];
};

export type InventoryMovementItem = {
  id: string;
  occurredAt: string;
  sku: string;
  productName: string;
  warehouseName: string;
  movementType: MovementType;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceDocument: string | null;
};

export type LowInventoryAlert = {
  id: string;
  branchName: string;
  warehouseName: string;
  sku: string;
  productName: string;
  quantity: number;
  minStock: number;
  shortageQuantity: number;
  updatedAt: string;
};

type ProductRow = {
  id: string;
  company_id: string;
  category_id: string | null;
  brand_id: string | null;
  supplier_id: string | null;
  sku: string;
  name: string;
  description: string | null;
  unit_of_measure: string;
  cost_price: number;
  sale_price: number;
  track_inventory: boolean;
  is_active: boolean;
  categories: { name: string } | null;
  brands: { name: string } | null;
  suppliers: { name: string } | null;
  product_barcodes: { barcode: string }[] | null;
  product_images: { image_url: string; alt_text: string }[] | null;
  inventory_balances:
    | {
        quantity: number;
        min_stock: number;
        max_stock: number;
        warehouses: { name: string } | null;
      }[]
    | null;
};

type MovementRow = {
  id: string;
  occurred_at: string;
  movement_type: MovementType;
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference_document: string | null;
  products: { sku: string; name: string } | null;
  warehouses: { name: string } | null;
};

function mapProduct(row: ProductRow): ProductDetail {
  const firstBarcode = row.product_barcodes?.[0]?.barcode ?? null;
  const firstImage = row.product_images?.[0] ?? null;
  const balances = row.inventory_balances ?? [];

  return {
    id: row.id,
    companyId: row.company_id,
    categoryId: row.category_id,
    brandId: row.brand_id,
    supplierId: row.supplier_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unitOfMeasure: row.unit_of_measure,
    costPrice: Number(row.cost_price),
    salePrice: Number(row.sale_price),
    trackInventory: row.track_inventory,
    isActive: row.is_active,
    categoryName: row.categories?.name ?? null,
    brandName: row.brands?.name ?? null,
    supplierName: row.suppliers?.name ?? null,
    barcode: firstBarcode,
    imageUrl: firstImage?.image_url ?? null,
    imageAltText: firstImage?.alt_text ?? null,
    totalStock: balances.reduce((total, balance) => total + Number(balance.quantity), 0),
    minStock: balances.reduce((total, balance) => total + Number(balance.min_stock), 0),
    maxStock: balances.reduce((total, balance) => total + Number(balance.max_stock), 0),
    stockBalances: balances.map((balance) => ({
      warehouseName: balance.warehouses?.name ?? "Almacén no disponible",
      quantity: Number(balance.quantity),
      minStock: Number(balance.min_stock),
      maxStock: Number(balance.max_stock)
    }))
  };
}

export async function getInventoryOptions(supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const [companies, categories, brands, suppliers, warehouses] = await Promise.all([
    client.from("companies").select("id, trade_name").order("trade_name"),
    client.from("categories").select("id, name, parent_id").order("name"),
    client.from("brands").select("id, name").order("name"),
    client.from("suppliers").select("id, name").eq("is_active", true).order("name"),
    client.from("warehouses").select("id, name, branches(name)").order("name")
  ]);

  return {
    companies: ((companies.data ?? []) as unknown as { id: string; trade_name: string }[]).map(
      (company) => ({ id: company.id, name: company.trade_name })
    ),
    categories: (
      (categories.data ?? []) as unknown as { id: string; name: string; parent_id: string | null }[]
    ).map((category) => ({ id: category.id, name: category.name, parentId: category.parent_id })),
    brands: ((brands.data ?? []) as unknown as SelectOption[]).map((brand) => ({
      id: brand.id,
      name: brand.name
    })),
    suppliers: ((suppliers.data ?? []) as unknown as SelectOption[]).map((supplier) => ({
      id: supplier.id,
      name: supplier.name
    })),
    warehouses: (
      (warehouses.data ?? []) as unknown as {
        id: string;
        name: string;
        branches: { name: string } | null;
      }[]
    ).map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      branchName: warehouse.branches?.name ?? "Sucursal no disponible"
    }))
  };
}

export async function getProducts(filters: {
  query?: string | undefined;
  companyId?: string | undefined;
  lowStockOnly?: boolean | undefined;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, company_id, category_id, brand_id, supplier_id, sku, name, description, unit_of_measure, cost_price, sale_price, track_inventory, is_active, categories(name), brands(name), suppliers(name), product_barcodes(barcode), product_images(image_url, alt_text), inventory_balances(quantity, min_stock, max_stock, warehouses(name))"
    )
    .eq("is_active", true)
    .order("name");

  if (filters.companyId) {
    query = query.eq("company_id", filters.companyId);
  }

  if (filters.query) {
    const sanitizedQuery = filters.query.replaceAll("%", "").replaceAll(",", " ").trim();
    if (sanitizedQuery.length > 0) {
      query = query.or(`sku.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("No fue posible consultar productos.");
  }

  const products = ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
  return filters.lowStockOnly
    ? products.filter((product) => product.minStock > 0 && product.totalStock <= product.minStock)
    : products;
}

export async function getProductById(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, company_id, category_id, brand_id, supplier_id, sku, name, description, unit_of_measure, cost_price, sale_price, track_inventory, is_active, categories(name), brands(name), suppliers(name), product_barcodes(barcode), product_images(image_url, alt_text), inventory_balances(quantity, min_stock, max_stock, warehouses(name))"
    )
    .eq("id", productId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProduct(data as unknown as ProductRow);
}

export async function getInventoryMovements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_movements")
    .select(
      "id, occurred_at, movement_type, quantity_delta, previous_quantity, new_quantity, reason, reference_document, products(sku, name), warehouses(name)"
    )
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("No fue posible consultar movimientos de inventario.");
  }

  return ((data ?? []) as unknown as MovementRow[]).map((movement) => ({
    id: movement.id,
    occurredAt: movement.occurred_at,
    sku: movement.products?.sku ?? "",
    productName: movement.products?.name ?? "",
    warehouseName: movement.warehouses?.name ?? "",
    movementType: movement.movement_type,
    quantityDelta: Number(movement.quantity_delta),
    previousQuantity: Number(movement.previous_quantity),
    newQuantity: Number(movement.new_quantity),
    reason: movement.reason,
    referenceDocument: movement.reference_document
  }));
}

export async function getLowInventoryAlerts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("low_inventory_alerts")
    .select("*")
    .order("shortage_quantity", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("No fue posible consultar alertas de inventario.");
  }

  return (
    (data ?? []) as unknown as Database["public"]["Views"]["low_inventory_alerts"]["Row"][]
  ).map((alert) => ({
    id: alert.id ?? "",
    branchName: alert.branch_name ?? "",
    warehouseName: alert.warehouse_name ?? "",
    sku: alert.sku ?? "",
    productName: alert.product_name ?? "",
    quantity: Number(alert.quantity ?? 0),
    minStock: Number(alert.min_stock ?? 0),
    shortageQuantity: Number(alert.shortage_quantity ?? 0),
    updatedAt: alert.updated_at ?? ""
  }));
}
