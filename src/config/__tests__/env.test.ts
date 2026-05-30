import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/config/env";

describe("parsePublicEnv", () => {
  it("accepts a complete public runtime configuration", () => {
    expect(
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        NEXT_PUBLIC_SITE_URL: "https://example.com"
      })
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      NEXT_PUBLIC_SITE_URL: "https://example.com"
    });
  });

  it("rejects missing and malformed runtime configuration", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        NEXT_PUBLIC_SITE_URL: "not-a-url"
      })
    ).toThrow();
  });
});
