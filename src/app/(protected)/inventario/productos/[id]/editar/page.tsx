import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/inventory/product-form";
import { StockSettingsForm } from "@/components/inventory/stock-settings-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deactivateProductAction } from "@/features/inventory/actions/inventory-actions";
import {
  getInventoryOptions,
  getProductById
} from "@/features/inventory/services/inventory-service";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, options] = await Promise.all([getProductById(id), getInventoryOptions()]);

  if (!product) notFound();

  const deactivateAction = deactivateProductAction.bind(null, product.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar producto</h1>
          <p className="text-muted-foreground">
            {product.sku} — {product.name}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventario">Volver a inventario</Link>
        </Button>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        companies={options.companies}
        categories={options.categories}
        brands={options.brands}
        suppliers={options.suppliers}
      />
      <Card>
        <CardHeader>
          <CardTitle>Stock mínimo y máximo por almacén</CardTitle>
        </CardHeader>
        <CardContent>
          <StockSettingsForm product={product} warehouses={options.warehouses} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Desactivar producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deactivateAction}>
            <Button type="submit" variant="destructive">
              Desactivar producto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
