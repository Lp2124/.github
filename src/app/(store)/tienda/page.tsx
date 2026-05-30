import type { Metadata } from "next";
import Link from "next/link";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreOptions, getStoreProducts } from "@/features/store/services/store-service";

export const metadata: Metadata = {
  title: "Ferretería De La O | Tienda online",
  description: "Catálogo online conectado a inventario real."
};
export default async function StoreHome() {
  const [products, options] = await Promise.all([
    getStoreProducts({ available: "1" }),
    getStoreOptions()
  ]);
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-muted p-8">
        <h1 className="text-4xl font-bold">Ferretería De La O en línea</h1>
        <p className="mt-2 text-muted-foreground">
          Compra productos disponibles en inventario real.
        </p>
        <Button asChild className="mt-4">
          <Link href="/tienda/catalogo">Ver catálogo</Link>
        </Button>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-semibold">Categorías</h2>
        <div className="flex flex-wrap gap-2">
          {options.categories.map((c) => (
            <Button key={c.id} asChild variant="outline">
              <Link href={`/tienda/catalogo?categoryId=${c.id}`}>{c.name}</Link>
            </Button>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {products.slice(0, 6).map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {p.sku} / Stock {p.stock}
              </p>
              <p className="text-xl font-bold">${p.price.toFixed(2)}</p>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/tienda/productos/${p.id}`}>Ver</Link>
                </Button>
                <AddToCartButton productId={p.id} disabled={p.stock <= 0} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
