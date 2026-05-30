import Link from "next/link";
import { CustomerProfileForm } from "@/components/store/customer-profile-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCustomerOrders } from "@/features/store/services/store-service";
export default async function AccountPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user)
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Mi cuenta</h1>
        <p>Inicia sesión para consultar tu perfil, favoritos e historial de pedidos.</p>
        <Button asChild>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  const [orders, profileResult] = await Promise.all([
    getCustomerOrders(),
    supabase
      .from("customer_profiles")
      .select("full_name,phone")
      .eq("user_id", data.user.id)
      .maybeSingle()
  ]);
  const profile = profileResult.data;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mi cuenta</h1>
      <CustomerProfileForm
        email={data.user.email ?? ""}
        fullName={profile?.full_name ?? ""}
        phone={profile?.phone ?? ""}
      />
      <Button asChild variant="outline">
        <Link href="/tienda/favoritos">Favoritos</Link>
      </Button>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Historial de pedidos</h2>
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border p-4">
            <p className="font-medium">Pedido {order.id}</p>
            <p>Estado: {order.status}</p>
            <p>Total: ${Number(order.total).toFixed(2)}</p>
            <p>Fecha: {new Date(order.created_at).toLocaleString("es-MX")}</p>
            {order.ecommerce_order_lines.map((line) => (
              <p key={line.product_name} className="text-sm text-muted-foreground">
                {line.quantity} x {line.product_name}
              </p>
            ))}
          </article>
        ))}
        {orders.length === 0 ? <p>No hay pedidos registrados.</p> : null}
      </section>
    </div>
  );
}
