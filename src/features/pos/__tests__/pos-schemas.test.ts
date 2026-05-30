import { describe, expect, it } from "vitest";
import {
  closeShiftSchema,
  createSaleSchema,
  openShiftSchema
} from "@/features/pos/schemas/pos-schemas";

describe("pos schemas", () => {
  it("validates opening a cash shift", () => {
    expect(
      openShiftSchema.safeParse({
        cashRegisterId: "00000000-0000-4000-8000-000000000001",
        openingFloat: "1500"
      }).success
    ).toBe(true);
  });

  it("requires sale items and payments", () => {
    expect(
      createSaleSchema.safeParse({
        warehouseId: "00000000-0000-4000-8000-000000000002",
        discountTotal: "0",
        items: [],
        payments: []
      }).success
    ).toBe(false);
  });

  it("rejects negative counted cash", () => {
    expect(
      closeShiftSchema.safeParse({
        cashShiftId: "00000000-0000-4000-8000-000000000003",
        countedCash: "-1",
        closingNotes: null
      }).success
    ).toBe(false);
  });
});
