import Link from "next/link";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { getInventoryOptions } from "@/features/inventory/services/inventory-service";

export default async function NewProductPage() {
  const options = await getInventoryOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo producto</h1>
          <p className="text-muted-foreground">
            Alta de producto con SKU único, código de barras, imagen, marca, proveedor y categoría.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventario">Volver a inventario</Link>
        </Button>
      </div>
      <ProductForm
        mode="create"
        companies={options.companies}
        categories={options.categories}
        brands={options.brands}
        suppliers={options.suppliers}
      />
    </div>
  );
}
