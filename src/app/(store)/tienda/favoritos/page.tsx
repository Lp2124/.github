import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user)
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Favoritos</h1>
        <p>Inicia sesión para administrar favoritos.</p>
        <Button asChild>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  const { data: favorites } = profile
    ? await supabase
        .from("customer_favorites")
        .select("products(id,sku,name,sale_price)")
        .eq("customer_profile_id", profile.id)
    : { data: [] };
  const rows = (favorites ?? []) as unknown as {
    products: { id: string; sku: string; name: string; sale_price: number } | null;
  }[];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Favoritos</h1>
      {rows.map((row) =>
        row.products ? (
          <article key={row.products.id} className="rounded-xl border p-4">
            <Link
              href={`/tienda/productos/${row.products.id}`}
              className="font-semibold hover:underline"
            >
              {row.products.name}
            </Link>
            <p>
              {row.products.sku} / ${Number(row.products.sale_price).toFixed(2)}
            </p>
          </article>
        ) : null
      )}
      {rows.length === 0 ? <p>No hay favoritos registrados.</p> : null}
    </div>
  );
}
