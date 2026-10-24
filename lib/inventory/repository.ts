import type { CatalogItem, CatalogKind } from "./types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Relation = { name?: string; symbol?: string; current_quantity?: number } | Array<{ name?: string; symbol?: string; current_quantity?: number }> | null;

function relationValue(relation: Relation) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export interface InventoryContext {
  workspaceId: string;
  userId: string;
}

export interface NewCatalogItem {
  kind: CatalogKind;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  lowStockAt: number;
  openingStock: number;
}

export async function loadLiveInventory(): Promise<{ context: InventoryContext; items: CatalogItem[] }> {
  const supabase = createSupabaseBrowserClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sign in to load live inventory.");

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", authData.user.id)
    .eq("is_active", true)
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error("Complete workspace setup before using live inventory.");

  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,kind,name,sku,purchase_cost,selling_price,low_stock_at,updated_at,category:product_categories(name),unit:units(symbol),stock:stock_balances(current_quantity)")
    .eq("workspace_id", membership.workspace_id)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;

  const tones = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-violet-500 to-fuchsia-600", "from-amber-500 to-orange-600"];
  const items: CatalogItem[] = (data || []).map((row, index) => {
    const category = relationValue(row.category as Relation);
    const unit = relationValue(row.unit as Relation);
    const stock = relationValue(row.stock as Relation);
    return {
      id: row.id,
      kind: row.kind as CatalogKind,
      name: row.name,
      sku: row.sku,
      category: category?.name || "Uncategorized",
      unit: unit?.symbol || "unit",
      cost: Number(row.purchase_cost),
      price: Number(row.selling_price),
      stock: Number(stock?.current_quantity || 0),
      lowStockAt: Number(row.low_stock_at),
      imageTone: tones[index % tones.length],
      updatedAt: new Date(row.updated_at).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }),
      movements: [],
    };
  });

  return { context: { workspaceId: membership.workspace_id, userId: authData.user.id }, items };
}

export async function postLiveStockAdjustment(context: InventoryContext, itemId: string, direction: "in" | "out", quantity: number, reason: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("post_stock_adjustment", {
    target_workspace_id: context.workspaceId,
    target_item_id: itemId,
    direction,
    adjustment_quantity: quantity,
    adjustment_reason: reason,
    adjustment_reference: `Manual adjustment ${new Date().toISOString()}`,
    adjustment_idempotency_key: crypto.randomUUID(),
  });
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return Number(result?.new_balance);
}

export async function createLiveCatalogItem(context: InventoryContext, input: NewCatalogItem) {
  const supabase = createSupabaseBrowserClient();
  const { data: itemId, error } = await supabase.rpc("create_catalog_item", {
    target_workspace_id: context.workspaceId,
    item_kind: input.kind,
    item_name: input.name.trim(),
    item_sku: input.sku.trim(),
    category_name: input.category.trim(),
    unit_name: input.unit.trim(),
    purchase_cost: input.cost,
    selling_price: input.price,
    low_stock_at: input.lowStockAt,
    opening_stock: input.kind === "product" ? input.openingStock : 0,
  });
  if (error) throw error;
  return itemId as string;
}
