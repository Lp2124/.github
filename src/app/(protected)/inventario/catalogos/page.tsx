import Link from "next/link";
import { CatalogForms } from "@/components/inventory/catalog-forms";
import { Button } from "@/components/ui/button";
import { getInventoryOptions } from "@/features/inventory/services/inventory-service";

export default async function CatalogsPage() {
  const options = await getInventoryOptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogos de inventario</h1>
          <p className="text-muted-foreground">
            Categorías, subcategorías, marcas y proveedores conectados a Supabase.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/inventario">Volver a inventario</Link>
        </Button>
      </div>
      <CatalogForms companies={options.companies} categories={options.categories} />
    </div>
  );
}
