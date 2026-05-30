import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/features/store/schemas/store-schemas";

describe("store schemas", () => {
  it("accepts a valid checkout payload", () => {
    expect(
      checkoutSchema.safeParse({
        fullName: "Cliente Real",
        phone: "5555555555",
        items: [{ productId: "00000000-0000-4000-8000-000000000001", quantity: 2 }]
      }).success
    ).toBe(true);
  });
  it("rejects checkout without items", () => {
    expect(
      checkoutSchema.safeParse({ fullName: "Cliente Real", phone: null, items: [] }).success
    ).toBe(false);
  });
});
