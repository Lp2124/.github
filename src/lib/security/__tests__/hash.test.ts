import { describe, expect, it } from "vitest";
import { sha256Hex } from "@/lib/security/hash";

describe("sha256Hex", () => {
  it("returns a deterministic 64-character hexadecimal digest", () => {
    const firstDigest = sha256Hex("auth.sign_in:user@example.com:127.0.0.1");
    const secondDigest = sha256Hex("auth.sign_in:user@example.com:127.0.0.1");

    expect(firstDigest).toBe(secondDigest);
    expect(firstDigest).toMatch(/^[a-f0-9]{64}$/);
  });
});
