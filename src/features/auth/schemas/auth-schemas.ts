import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Ingresa un correo electrónico válido.")
  .max(320);

export const passwordSchema = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .max(128, "La contraseña no puede superar 128 caracteres.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña.").max(128)
});

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña.")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"]
  });
