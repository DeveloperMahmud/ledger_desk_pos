import { describe, expect, it } from "vitest";
import { calculateStock, canApplyOutboundAdjustment, getStockStatus, inventoryValue, movementDelta } from "@/lib/inventory/rules";

describe("inventory rules", () => {
  it("calculates immutable movement balance", () => {
    expect(calculateStock([
      { kind: "opening", quantity: 100 },
      { kind: "purchase", quantity: 25 },
      { kind: "sale", quantity: 18 },
      { kind: "damage", quantity: 2 },
    ])).toBe(105);
  });

  it("rejects zero or negative movement quantities", () => {
    expect(() => movementDelta({ kind: "sale", quantity: 0 })).toThrow();
    expect(() => movementDelta({ kind: "purchase", quantity: -2 })).toThrow();
  });

  it("derives product and service stock states", () => {
    expect(getStockStatus("product", 0, 5)).toBe("out");
    expect(getStockStatus("product", 4, 5)).toBe("low");
    expect(getStockStatus("product", 12, 5)).toBe("healthy");
    expect(getStockStatus("service", 0, 0)).toBe("not_tracked");
  });

  it("values only physical inventory", () => {
    expect(inventoryValue([
      { kind: "product", stock: 10, cost: 30 },
      { kind: "service", stock: 12, cost: 500 },
    ])).toBe(300);
  });

  it("prevents outbound adjustment from making negative stock", () => {
    expect(canApplyOutboundAdjustment(8, 8)).toBe(true);
    expect(canApplyOutboundAdjustment(8, 9)).toBe(false);
  });
});
