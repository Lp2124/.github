import { CheckoutForm } from "@/components/store/checkout-form";
import { createClient } from "@/lib/supabase/server";
export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="text-sm text-muted-foreground">
        El pedido solo se crea si Mercado Pago está configurado y hay sesión autenticada.
      </p>
      <CheckoutForm isAuthenticated={Boolean(data.user)} />
    </div>
  );
}
