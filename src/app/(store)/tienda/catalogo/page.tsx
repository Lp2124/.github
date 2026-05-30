import type { Metadata } from "next";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStoreOptions, getStoreProducts } from "@/features/store/services/store-service";

export const metadata: Metadata = { title: "Catálogo | Ferretería De La O" };
type Props = {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: string;
    maxPrice?: string;
    available?: string;
  }>;
};
export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const [options, products] = await Promise.all([getStoreOptions(), getStoreProducts(params)]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Catálogo</h1>
      <form className="grid gap-3 rounded-xl border p-4 md:grid-cols-6">
        <Input name="q" defaultValue={params.q ?? ""} aria-label="Buscar" />
        <select
          name="categoryId"
          defaultValue={params.categoryId ?? ""}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="">Categoría</option>
          {options.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="brandId"
          defaultValue={params.brandId ?? ""}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="">Marca</option>
          {options.brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <Input
          name="minPrice"
          type="number"
          min="0"
          defaultValue={params.minPrice ?? ""}
          aria-label="Precio mínimo"
        />
        <Input
          name="maxPrice"
          type="number"
          min="0"
          defaultValue={params.maxPrice ?? ""}
          aria-label="Precio máximo"
        />
        <select
          name="available"
          defaultValue={params.available ?? ""}
          className="h-10 rounded-md border bg-background px-3"
        >
          <option value="">Disponibilidad</option>
          <option value="1">Con stock</option>
        </select>
        <Button type="submit">Filtrar</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((p) => (
          <article key={p.id} className="rounded-xl border p-4">
            <Link href={`/tienda/productos/${p.id}`} className="font-semibold hover:underline">
              {p.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {p.categoryName ?? "Sin categoría"} / {p.brandName ?? "Sin marca"}
            </p>
            <p className="mt-2 text-xl font-bold">${p.price.toFixed(2)}</p>
            <p className="text-sm">Stock disponible: {p.stock}</p>
            <div className="mt-3">
              <AddToCartButton productId={p.id} disabled={p.stock <= 0} />
            </div>
          </article>
        ))}
      </div>
      {products.length === 0 ? <p>No hay productos para los filtros seleccionados.</p> : null}
    </div>
  );
}
