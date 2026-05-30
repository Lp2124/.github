import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  updatePasswordSchema
} from "@/features/auth/schemas/auth-schemas";

describe("auth schemas", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "valid-password" });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email input", () => {
    const result = forgotPasswordSchema.safeParse({ email: "invalid-email" });

    expect(result.success).toBe(false);
  });

  it("requires strong password length and confirmation match", () => {
    const weakPassword = updatePasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short"
    });
    const mismatchedPassword = updatePasswordSchema.safeParse({
      password: "a-secure-password",
      confirmPassword: "another-secure-password"
    });
    const validPassword = updatePasswordSchema.safeParse({
      password: "a-secure-password",
      confirmPassword: "a-secure-password"
    });

    expect(weakPassword.success).toBe(false);
    expect(mismatchedPassword.success).toBe(false);
    expect(validPassword.success).toBe(true);
  });
});
