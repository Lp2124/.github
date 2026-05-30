import { NextResponse } from "next/server";
import { getProducts } from "@/features/inventory/services/inventory-service";

function csvCell(value: string | number | null) {
  const normalized = value === null ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

export async function GET() {
  const products = await getProducts({});
  const header = [
    "SKU",
    "Producto",
    "Codigo de barras",
    "Categoria",
    "Marca",
    "Proveedor",
    "Stock",
    "Stock minimo",
    "Stock maximo",
    "Costo",
    "Precio venta"
  ];
  const rows = products.map((product) => [
    product.sku,
    product.name,
    product.barcode,
    product.categoryName,
    product.brandName,
    product.supplierName,
    product.totalStock,
    product.minStock,
    product.maxStock,
    product.costPrice,
    product.salePrice
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventario-ferreteria-de-la-o.csv"',
      "Cache-Control": "no-store"
    }
  });
}
