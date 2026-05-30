import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/features/store/actions/store-actions";
import { createClient } from "@/lib/supabase/server";
import { getStoreProduct } from "@/features/store/services/store-service";

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getStoreProduct(id);
  return { title: product ? `${product.name} | Ferretería De La O` : "Producto" };
}
export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getStoreProduct(id);
  if (!product) notFound();
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const favoriteAction = toggleFavoriteAction.bind(null, product.id);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-xl border bg-muted p-8">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={640}
            height={480}
            className="mx-auto max-h-96 object-contain"
          />
        ) : (
          <p className="text-center text-muted-foreground">
            Imagen no registrada para este producto.
          </p>
        )}
      </div>
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">{product.sku}</p>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p>{product.description ?? "Descripción no registrada."}</p>
        <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>
        <p>IVA calculado en checkout: 16%</p>
        <p>Stock disponible: {product.stock}</p>
        <div className="flex flex-wrap gap-3">
          <AddToCartButton productId={product.id} disabled={product.stock <= 0} />
          {userData.user ? (
            <form action={favoriteAction}>
              <Button type="submit" variant="outline">
                Alternar favorito
              </Button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
