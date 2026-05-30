"use server";

import { revalidatePath } from "next/cache";
import { publicEnv } from "@/config/env";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, customerProfileSchema } from "@/features/store/schemas/store-schemas";

export type StoreActionState = {
  status: "idle" | "success" | "error";
  message: string;
  redirectUrl?: string;
};
const fail = (message: string): StoreActionState => ({ status: "error", message });
const ok = (message: string, redirectUrl?: string): StoreActionState =>
  redirectUrl ? { status: "success", message, redirectUrl } : { status: "success", message };

export async function checkoutAction(
  _state: StoreActionState,
  formData: FormData
): Promise<StoreActionState> {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return fail(
      "Mercado Pago no está configurado. El checkout está bloqueado para evitar pedidos sin cobro real."
    );
  }
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return fail("El carrito no tiene un formato válido.");
  }
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    items
  });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "Datos de checkout inválidos.");

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("create_ecommerce_order", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_items: parsed.data.items.map((i) => ({ product_id: i.productId, quantity: i.quantity }))
  });
  if (error || !orderId) {
    logger.warn("store.checkout.order_failed", { errorCode: error?.code ?? null });
    return fail("No fue posible crear el pedido. Verifica sesión, stock y carrito.");
  }

  const { data: order } = await supabase
    .from("ecommerce_orders")
    .select("id,total,ecommerce_order_lines(product_name,quantity,unit_price)")
    .eq("id", orderId)
    .single();
  const preference = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_reference: orderId,
      items: (
        (
          order as {
            ecommerce_order_lines?: {
              product_name: string;
              quantity: number;
              unit_price: number;
            }[];
          } | null
        )?.ecommerce_order_lines ?? []
      ).map((line) => ({
        title: line.product_name,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
        currency_id: "MXN"
      })),
      back_urls: {
        success: `${publicEnv.NEXT_PUBLIC_SITE_URL}/tienda/cuenta`,
        failure: `${publicEnv.NEXT_PUBLIC_SITE_URL}/tienda/checkout`,
        pending: `${publicEnv.NEXT_PUBLIC_SITE_URL}/tienda/cuenta`
      },
      auto_return: "approved"
    })
  });
  if (!preference.ok) {
    await supabase.from("ecommerce_payment_preferences").insert({
      order_id: orderId,
      provider: "mercado_pago",
      status: "failed",
      error_message: "Mercado Pago rechazó la preferencia."
    });
    return fail("Mercado Pago no pudo generar la preferencia de pago.");
  }
  const body = (await preference.json()) as { id?: string; init_point?: string };
  if (!body.id || !body.init_point) return fail("Mercado Pago respondió sin liga de pago.");
  await supabase.from("ecommerce_payment_preferences").insert({
    order_id: orderId,
    provider: "mercado_pago",
    provider_preference_id: body.id,
    init_point: body.init_point,
    status: "created"
  });
  await supabase
    .from("ecommerce_orders")
    .update({ mercado_pago_preference_id: body.id, mercado_pago_init_point: body.init_point })
    .eq("id", orderId);
  revalidatePath("/tienda/cuenta");
  return ok("Pedido creado. Continúa el pago en Mercado Pago.", body.init_point);
}

export async function updateCustomerProfileAction(
  _state: StoreActionState,
  formData: FormData
): Promise<StoreActionState> {
  const parsed = customerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone")
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos de perfil inválidos.");
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return fail("Debes iniciar sesión para actualizar tu perfil.");

  const { error } = await supabase.from("customer_profiles").upsert(
    {
      user_id: userResult.user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone
    },
    { onConflict: "user_id" }
  );
  if (error) {
    logger.warn("store.profile.update_failed", { errorCode: error.code });
    return fail("No fue posible actualizar el perfil del cliente.");
  }
  revalidatePath("/tienda/cuenta");
  return ok("Perfil actualizado correctamente.");
}

export async function toggleFavoriteAction(productId: string) {
  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user?.email) return;
  const { data: existingProfile } = await supabase
    .from("customer_profiles")
    .select("id")
    .eq("user_id", userResult.user.id)
    .maybeSingle();
  const profile = existingProfile
    ? existingProfile
    : (
        await supabase
          .from("customer_profiles")
          .insert({ user_id: userResult.user.id, full_name: userResult.user.email, phone: null })
          .select("id")
          .single()
      ).data;
  if (!profile) return;
  const { data: existing } = await supabase
    .from("customer_favorites")
    .select("product_id")
    .eq("customer_profile_id", profile.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("customer_favorites")
      .delete()
      .eq("customer_profile_id", profile.id)
      .eq("product_id", productId);
  } else {
    await supabase
      .from("customer_favorites")
      .insert({ customer_profile_id: profile.id, product_id: productId });
  }
  revalidatePath("/tienda/favoritos");
  revalidatePath(`/tienda/productos/${productId}`);
}
