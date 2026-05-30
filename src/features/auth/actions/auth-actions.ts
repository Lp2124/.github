"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publicEnv } from "@/config/env";
import { logger } from "@/lib/observability/logger";
import { consumeAuthRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  updatePasswordSchema
} from "@/features/auth/schemas/auth-schemas";

export type AuthActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const rateLimitAllowed = await consumeAuthRateLimit("auth.sign_in", parsed.data.email);

  if (!rateLimitAllowed) {
    logger.warn("auth.sign_in.rate_limited", { principalType: "email" });
    return { status: "error", message: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    logger.warn("auth.sign_in.failed", { errorCode: error.code ?? null });
    return {
      status: "error",
      message: "No fue posible iniciar sesión con las credenciales proporcionadas."
    };
  }

  logger.info("auth.sign_in.succeeded");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Correo inválido." };
  }

  const rateLimitAllowed = await consumeAuthRateLimit("auth.password_reset", parsed.data.email);

  if (!rateLimitAllowed) {
    logger.warn("auth.password_reset.rate_limited", { principalType: "email" });
    return { status: "error", message: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/update-password`
  });

  if (error) {
    logger.warn("auth.password_reset.failed", { errorCode: error.code ?? null });
    return { status: "error", message: "No fue posible procesar la recuperación de contraseña." };
  }

  logger.info("auth.password_reset.requested");

  return {
    status: "success",
    message: "Si el correo existe, recibirás instrucciones para restablecer la contraseña."
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    logger.warn("auth.password_update.unauthenticated");
    return { status: "error", message: "La sesión no es válida para actualizar la contraseña." };
  }

  const rateLimitAllowed = await consumeAuthRateLimit("auth.password_update", user.id);

  if (!rateLimitAllowed) {
    logger.warn("auth.password_update.rate_limited");
    return { status: "error", message: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logger.warn("auth.password_update.failed", { errorCode: error.code ?? null });
    return { status: "error", message: "No fue posible actualizar la contraseña." };
  }

  logger.info("auth.password_update.succeeded");

  revalidatePath("/", "layout");
  return { status: "success", message: "Contraseña actualizada correctamente." };
}
