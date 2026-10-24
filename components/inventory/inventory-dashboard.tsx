"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  Boxes,
  CircleAlert,
  FileDown,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { inventoryItems as initialItems } from "@/lib/inventory/demo-data";
import { createLiveCatalogItem, loadLiveInventory, postLiveStockAdjustment, type InventoryContext, type NewCatalogItem } from "@/lib/inventory/repository";
import { canApplyOutboundAdjustment, formatMoney, getStockStatus, inventoryValue } from "@/lib/inventory/rules";
import type { CatalogItem, StockStatus } from "@/lib/inventory/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const statusStyle: Record<StockStatus, { label: string; className: string }> = {
  healthy: { label: "In stock", className: "bg-emerald-50 text-emerald-700" },
  low: { label: "Low stock", className: "bg-amber-50 text-amber-700" },
  out: { label: "Out of stock", className: "bg-red-50 text-red-700" },
  not_tracked: { label: "Service", className: "bg-violet-50 text-violet-700" },
};

export function InventoryDashboard() {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "product" | "service" | "low">("all");
  const [adjusting, setAdjusting] = useState<CatalogItem | null>(null);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [context, setContext] = useState<InventoryContext | null>(null);
  const [dataMode, setDataMode] = useState<"preview" | "loading" | "live" | "error">(isSupabaseConfigured() ? "loading" : "preview");
  const [dataError, setDataError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    loadLiveInventory().then((result) => {
      if (!active) return;
      setItems(result.items);
      setContext(result.context);
      setDataMode("live");
    }).catch((loadError) => {
      if (!active) return;
      setDataError(loadError instanceof Error ? loadError.message : "Live inventory could not be loaded.");
      setDataMode("error");
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !needle || [item.name, item.sku, item.category].some((value) => value.toLowerCase().includes(needle));
      const status = getStockStatus(item.kind, item.stock, item.lowStockAt);
      const matchesFilter = filter === "all" || item.kind === filter || (filter === "low" && (status === "low" || status === "out"));
      return matchesSearch && matchesFilter;
    });
  }, [filter, items, query]);

  const products = items.filter((item) => item.kind === "product");
  const lowCount = products.filter((item) => ["low", "out"].includes(getStockStatus(item.kind, item.stock, item.lowStockAt))).length;

  function openAdjustment(item: CatalogItem) {
    setAdjusting(item);
    setDirection("in");
    setQuantity("");
    setReason("");
    setError("");
  }

  async function applyAdjustment() {
    if (!adjusting) return;
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Add a short reason for the audit log.");
      return;
    }
    if (direction === "out" && !canApplyOutboundAdjustment(adjusting.stock, amount)) {
      setError("This adjustment would make stock negative.");
      return;
    }

    setSaving(true);
    try {
      const newBalance = context
        ? await postLiveStockAdjustment(context, adjusting.id, direction, amount, reason.trim())
        : adjusting.stock + (direction === "in" ? amount : -amount);
      setItems((current) => current.map((item) => item.id === adjusting.id ? { ...item, stock: newBalance, updatedAt: "Just now" } : item));
      setAdjusting(null);
    } catch (adjustmentError) {
      setError(adjustmentError instanceof Error ? adjustmentError.message : "Stock adjustment failed.");
    } finally {
      setSaving(false);
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError("");
    const form = new FormData(event.currentTarget);
    const input: NewCatalogItem = {
      kind: form.get("kind") === "service" ? "service" : "product",
      name: String(form.get("name") || "").trim(),
      sku: String(form.get("sku") || "").trim(),
      category: String(form.get("category") || "General").trim() || "General",
      unit: String(form.get("unit") || "pcs").trim() || "pcs",
      cost: Number(form.get("cost") || 0),
      price: Number(form.get("price") || 0),
      lowStockAt: Number(form.get("lowStockAt") || 0),
      openingStock: Number(form.get("openingStock") || 0),
    };
    if (input.name.length < 2 || !input.sku || input.price < 0 || input.cost < 0 || input.openingStock < 0) {
      setAddError("Add a name, SKU and valid non-negative amounts.");
      return;
    }
    setSaving(true);
    try {
      let id = `preview-${Date.now()}`;
      if (context) id = await createLiveCatalogItem(context, input);
      const created: CatalogItem = { id, kind: input.kind, name: input.name, sku: input.sku, category: input.category, unit: input.unit, cost: input.cost, price: input.price, stock: input.kind === "product" ? input.openingStock : 0, lowStockAt: input.lowStockAt, imageTone: "from-blue-500 to-indigo-600", updatedAt: "Just now", movements: [] };
      setItems((current) => [created, ...current]);
      setAdding(false);
    } catch (createError) {
      setAddError(createError instanceof Error ? createError.message : "Item could not be created.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [["Name", "SKU", "Type", "Category", "Unit", "Stock", "Cost", "Price"], ...items.map((item) => [item.name, item.sku, item.kind, item.category, item.unit, item.stock, item.cost, item.price])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold text-[#7a8495]">Catalog & stock control</p>
          <h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f] sm:text-[30px]">Inventory</h1>
          <p className="mt-1.5 text-sm text-[#7b8596]">Products, services and every stock movement in one place. <span className={`ml-1 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${dataMode === "live" ? "bg-emerald-50 text-emerald-700" : dataMode === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{dataMode}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/inventory/labels" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] bg-white px-4 py-2.5 text-xs font-bold text-[#3c4a60] hover:bg-[#f7f8fa]"><Printer size={15} /> Print labels</Link>
          <button onClick={() => { setAddError(""); setAdding(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20"><Plus size={16} /> Add item</button>
        </div>
      </header>

      {dataError && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{dataError} Preview data remains available until the live workspace is ready.</p>}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Boxes} label="Catalog items" value={String(items.length)} note={`${products.length} products · ${items.length - products.length} services`} tone="blue" />
        <Stat icon={Box} label="Inventory value" value={formatMoney(inventoryValue(items))} note="Based on current purchase cost" tone="violet" />
        <Stat icon={PackageCheck} label="Units on hand" value={String(products.reduce((total, item) => total + item.stock, 0))} note="Across all physical products" tone="green" />
        <Stat icon={CircleAlert} label="Need attention" value={String(lowCount)} note="Low or out-of-stock products" tone="amber" />
      </section>

      <section className="card-shadow overflow-hidden rounded-2xl border border-[#e5e8ed] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#eceef2] p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a1af]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by item name, SKU or category" className="h-10 w-full rounded-xl border border-[#e0e4ea] bg-[#f9fafb] pl-10 pr-4 text-xs outline-none focus:border-[#7897fa] focus:bg-white focus:ring-4 focus:ring-[#e7edff]" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(["all", "product", "service", "low"] as const).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={cn("whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-[11px] font-bold capitalize", filter === value ? "border-[#9db2f7] bg-[#edf2ff] text-[#3157be]" : "border-[#e0e4ea] text-[#667286]")}>{value === "low" ? "Needs attention" : value}</button>
            ))}
            <button className="rounded-xl border border-[#e0e4ea] p-2.5 text-[#687487]"><SlidersHorizontal size={15} /></button>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#edf0f3] bg-[#fafbfc] text-[10px] font-bold uppercase tracking-[.08em] text-[#8e97a5]">
                <th className="px-5 py-3.5">Item</th><th className="px-4 py-3.5">Type</th><th className="px-4 py-3.5">Stock</th><th className="px-4 py-3.5">Cost</th><th className="px-4 py-3.5">Selling price</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eff1f4]">
              {filtered.map((item) => {
                const status = getStockStatus(item.kind, item.stock, item.lowStockAt);
                return (
                  <tr key={item.id} className="group transition hover:bg-[#fafbfe]">
                    <td className="px-5 py-4">
                      <Link href={`/inventory/${item.id}`} className="flex items-center gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.imageTone} text-white shadow-sm`}><Box size={17} /></span>
                        <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#2e3c53]">{item.name}</span><span className="mt-1 block text-[10px] font-semibold text-[#9199a6]">{item.sku} · {item.category}</span></span>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-xs capitalize text-[#637084]">{item.kind}</td>
                    <td className="px-4 py-4"><span className="text-xs font-extrabold text-[#334157]">{item.kind === "service" ? "—" : item.stock}</span><span className="ml-1 text-[10px] text-[#949ca8]">{item.kind === "product" ? item.unit : ""}</span></td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#536074]">{item.kind === "product" ? formatMoney(item.cost) : "—"}</td>
                    <td className="px-4 py-4 text-xs font-extrabold text-[#334157]">{formatMoney(item.price)}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusStyle[status].className}`}>{statusStyle[status].label}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        {item.kind === "product" && <button onClick={() => openAdjustment(item)} className="rounded-lg border border-[#e0e4ea] px-3 py-2 text-[10px] font-bold text-[#4f5e74] hover:border-[#9bb0f5] hover:text-[#3157be]">Adjust</button>}
                        <Link href={`/inventory/${item.id}`} aria-label={`Open ${item.name}`} className="rounded-lg p-2 text-[#8c95a3] hover:bg-[#eef2fa]"><MoreHorizontal size={16} /></Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#eff1f4] md:hidden">
          {filtered.map((item) => {
            const status = getStockStatus(item.kind, item.stock, item.lowStockAt);
            return (
              <div key={item.id} className="p-4">
                <div className="flex gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.imageTone} text-white`}><Box size={17} /></span>
                  <div className="min-w-0 flex-1"><Link href={`/inventory/${item.id}`} className="truncate text-xs font-extrabold text-[#2e3c53]">{item.name}</Link><p className="mt-1 text-[10px] text-[#929aa7]">{item.sku} · {item.category}</p></div>
                  <span className={`h-fit rounded-full px-2.5 py-1 text-[9px] font-extrabold ${statusStyle[status].className}`}>{statusStyle[status].label}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#f8f9fb] p-3 text-center"><SmallMetric label="Stock" value={item.kind === "product" ? `${item.stock} ${item.unit}` : "—"} /><SmallMetric label="Cost" value={item.kind === "product" ? formatMoney(item.cost) : "—"} /><SmallMetric label="Price" value={formatMoney(item.price)} /></div>
                {item.kind === "product" && <button onClick={() => openAdjustment(item)} className="mt-3 w-full rounded-xl border border-[#e0e4ea] py-2.5 text-[11px] font-bold text-[#4f5e74]">Adjust stock</button>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[#eceef2] px-5 py-4 text-[11px] text-[#818b9a]"><span>Showing {filtered.length} of {items.length} items</span><button onClick={exportCsv} className="inline-flex items-center gap-1 font-bold text-[#4b5b72]">Export CSV <FileDown size={13} /></button></div>
      </section>

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#111c2d]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Add inventory item">
          <form onSubmit={addItem} className="my-6 w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8992a0]">Catalog</p><h2 className="heading mt-1 text-lg font-extrabold text-[#23324a]">Add product or service</h2></div><button type="button" aria-label="Close add item" onClick={() => setAdding(false)} className="rounded-lg p-2 text-[#8993a1]"><X size={18} /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ModalField name="name" label="Item name" required />
              <ModalField name="sku" label="SKU / code" required />
              <label><span className="mb-2 block text-xs font-bold text-[#46556b]">Type</span><select name="kind" className="h-11 w-full rounded-xl border border-[#dce1e8] bg-white px-3 text-xs"><option value="product">Product</option><option value="service">Service</option></select></label>
              <ModalField name="category" label="Category" defaultValue="General" required />
              <ModalField name="unit" label="Unit" defaultValue="pcs" required />
              <ModalField name="openingStock" label="Opening stock" type="number" defaultValue="0" min="0" step="0.01" />
              <ModalField name="cost" label="Purchase cost" type="number" defaultValue="0" min="0" step="0.01" />
              <ModalField name="price" label="Selling price" type="number" defaultValue="0" min="0" step="0.01" />
              <ModalField name="lowStockAt" label="Low-stock alert at" type="number" defaultValue="0" min="0" step="0.01" />
            </div>
            {addError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{addError}</p>}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-[#e0e4ea] px-4 py-2.5 text-xs font-bold text-[#647084]">Cancel</button><button disabled={saving} className="rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Saving..." : "Save item"}</button></div>
          </form>
        </div>
      )}

      {adjusting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111c2d]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Adjust stock">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8992a0]">Stock adjustment</p><h2 className="heading mt-1 text-lg font-extrabold text-[#23324a]">{adjusting.name}</h2><p className="mt-1 text-xs text-[#8992a0]">Current stock: <strong className="text-[#46556b]">{adjusting.stock} {adjusting.unit}</strong></p></div><button aria-label="Close adjustment" onClick={() => setAdjusting(null)} className="rounded-lg p-2 text-[#8993a1] hover:bg-[#f3f4f6]"><X size={18} /></button></div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setDirection("in")} className={cn("flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-extrabold", direction === "in" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-[#e1e5eb] text-[#6c7788]")}><ArrowDownToLine size={16} /> Stock in</button>
              <button onClick={() => setDirection("out")} className={cn("flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-extrabold", direction === "out" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-[#e1e5eb] text-[#6c7788]")}><ArrowUpFromLine size={16} /> Stock out</button>
            </div>
            <label className="mt-5 block"><span className="mb-2 block text-xs font-bold text-[#46556b]">Quantity</span><div className="flex"><input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0.01" step="0.01" autoFocus className="h-11 min-w-0 flex-1 rounded-l-xl border border-[#dce1e8] px-4 text-sm outline-none focus:border-[#7897fa]" /><span className="grid place-items-center rounded-r-xl border border-l-0 border-[#dce1e8] bg-[#f7f8fa] px-4 text-xs font-bold text-[#758094]">{adjusting.unit}</span></div></label>
            <label className="mt-4 block"><span className="mb-2 block text-xs font-bold text-[#46556b]">Reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Why is the stock changing?" className="w-full resize-none rounded-xl border border-[#dce1e8] px-4 py-3 text-xs outline-none focus:border-[#7897fa]" /></label>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setAdjusting(null)} className="rounded-xl border border-[#e0e4ea] px-4 py-2.5 text-xs font-bold text-[#647084]">Cancel</button><button disabled={saving} onClick={applyAdjustment} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Wrench size={14} /> {saving ? "Posting..." : "Post adjustment"}</button></div>
            <p className="mt-4 text-[10px] leading-4 text-[#9aa2ae]">Posting creates an immutable movement and audit record. It never overwrites stock history.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, tone }: { icon: typeof Boxes; label: string; value: string; note: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
  return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}><Icon size={19} /></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[23px] font-extrabold tracking-[-.03em] text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] font-medium text-[#969eaa]">{note}</p></article>;
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-[9px] font-bold uppercase tracking-wide text-[#9aa2ae]">{label}</span><span className="mt-1 block text-[10px] font-extrabold text-[#45536a]">{value}</span></div>;
}

function ModalField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label><span className="mb-2 block text-xs font-bold text-[#46556b]">{label}</span><input {...props} className="h-11 w-full rounded-xl border border-[#dce1e8] px-3 text-xs outline-none focus:border-[#7897fa]" /></label>;
}
