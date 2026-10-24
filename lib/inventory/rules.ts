import type { CatalogKind, StockMovement, StockStatus } from "./types";

const inboundKinds = new Set<StockMovement["kind"]>(["opening", "purchase", "return_in", "adjustment_in"]);

export function movementDelta(movement: Pick<StockMovement, "kind" | "quantity">) {
  if (!Number.isFinite(movement.quantity) || movement.quantity <= 0) {
    throw new Error("Stock movement quantity must be greater than zero.");
  }
  return inboundKinds.has(movement.kind) ? movement.quantity : -movement.quantity;
}

export function calculateStock(movements: Array<Pick<StockMovement, "kind" | "quantity">>) {
  return movements.reduce((balance, movement) => balance + movementDelta(movement), 0);
}

export function getStockStatus(kind: CatalogKind, stock: number, lowStockAt: number): StockStatus {
  if (kind === "service") return "not_tracked";
  if (stock <= 0) return "out";
  if (stock <= Math.max(0, lowStockAt)) return "low";
  return "healthy";
}

export function inventoryValue(items: Array<{ kind: CatalogKind; stock: number; cost: number }>) {
  return items.reduce((total, item) => {
    if (item.kind === "service") return total;
    return total + Math.max(0, item.stock) * Math.max(0, item.cost);
  }, 0);
}

export function canApplyOutboundAdjustment(currentStock: number, quantity: number) {
  return Number.isFinite(quantity) && quantity > 0 && currentStock - quantity >= 0;
}

export function formatMoney(value: number, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
