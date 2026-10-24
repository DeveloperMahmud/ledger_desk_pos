export type CatalogKind = "product" | "service";
export type StockStatus = "healthy" | "low" | "out" | "not_tracked";

export type StockMovementKind =
  | "opening"
  | "purchase"
  | "sale"
  | "return_in"
  | "return_out"
  | "adjustment_in"
  | "adjustment_out"
  | "damage";

export interface StockMovement {
  id: string;
  kind: StockMovementKind;
  quantity: number;
  occurredAt: string;
  reference: string;
  note?: string;
  actor: string;
}

export interface CatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  lowStockAt: number;
  imageTone: string;
  updatedAt: string;
  movements: StockMovement[];
}
