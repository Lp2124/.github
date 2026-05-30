import { createClient } from "@/lib/supabase/server";

export type StoreProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number;
  categoryName: string | null;
  brandName: string | null;
  imageUrl: string | null;
  stock: number;
};
export type StoreFilters = {
  q?: string | undefined;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  available?: string | undefined;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  sale_price: number;
  categories: { name: string } | null;
  brands: { name: string } | null;
  product_images: { image_url: string }[] | null;
  inventory_balances: { quantity: number; reserved_quantity: number }[] | null;
};
const productSelect =
  "id, sku, name, description, sale_price, categories(name), brands(name), product_images(image_url), inventory_balances(quantity,reserved_quantity)";

function sanitizeSearchTerm(value: string) {
  return value
    .replace(/[^\p{L}\p{N} ._#-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numericFilter(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function mapProduct(row: ProductRow): StoreProduct {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    price: Number(row.sale_price),
    categoryName: row.categories?.name ?? null,
    brandName: row.brands?.name ?? null,
    imageUrl: row.product_images?.[0]?.image_url ?? null,
    stock: (row.inventory_balances ?? []).reduce(
      (t, b) => t + Number(b.quantity) - Number(b.reserved_quantity),
      0
    )
  };
}

export async function getStoreOptions() {
  const supabase = await createClient();
  const [categories, brands] = await Promise.all([
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("brands").select("id,name").order("name")
  ]);
  return {
    categories: (categories.data ?? []) as { id: string; name: string }[],
    brands: (brands.data ?? []) as { id: string; name: string }[]
  };
}

export async function getStoreProducts(filters: StoreFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("name")
    .limit(100);
  if (filters.q) {
    const q = sanitizeSearchTerm(filters.q);
    if (q) query = query.or(`sku.ilike.%${q}%,name.ilike.%${q}%`);
  }
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.brandId) query = query.eq("brand_id", filters.brandId);
  const minPrice = numericFilter(filters.minPrice);
  const maxPrice = numericFilter(filters.maxPrice);
  if (minPrice !== null) query = query.gte("sale_price", minPrice);
  if (maxPrice !== null) query = query.lte("sale_price", maxPrice);
  const { data, error } = await query;
  if (error) throw new Error("No fue posible consultar el catálogo.");
  const products = ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
  return filters.available === "1" ? products.filter((p) => p.stock > 0) : products;
}

export async function getStoreProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("No fue posible consultar el producto.");
  return data ? mapProduct(data as unknown as ProductRow) : null;
}

export async function getCustomerOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ecommerce_orders")
    .select("id,status,total,created_at,ecommerce_order_lines(product_name,quantity,line_total)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as {
    id: string;
    status: string;
    total: number;
    created_at: string;
    ecommerce_order_lines: { product_name: string; quantity: number; line_total: number }[];
  }[];
}
