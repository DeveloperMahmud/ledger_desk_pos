import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Box, Clock3, FileText, Printer, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { findInventoryItem } from "@/lib/inventory/demo-data";
import { formatMoney, getStockStatus, movementDelta } from "@/lib/inventory/rules";

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = findInventoryItem(id);
  if (!item) notFound();

  const status = getStockStatus(item.kind, item.stock, item.lowStockAt);
  const statusLabel = status === "healthy" ? "Healthy stock" : status === "low" ? "Low stock" : status === "out" ? "Out of stock" : "Service item";

  return (
    <AppShell>
      <div className="mx-auto max-w-[1250px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <Link href="/inventory" className="inline-flex items-center gap-2 text-xs font-bold text-[#6f7a8c] hover:text-[#3157be]"><ArrowLeft size={15} /> Back to inventory</Link>
        <header className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex items-start gap-4">
            <span className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${item.imageTone} text-white shadow-lg`}><Box size={27} /></span>
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f]">{item.name}</h1><span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-extrabold capitalize text-[#425fac]">{item.kind}</span></div><p className="mt-1.5 text-xs font-semibold text-[#8992a0]">{item.sku} · {item.category} · Updated {item.updatedAt}</p></div>
          </div>
          <div className="flex gap-2"><Link href="/inventory/labels" className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] bg-white px-4 py-2.5 text-xs font-bold text-[#3c4a60]"><Printer size={15} /> Print label</Link><button className="rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white">Adjust stock</button></div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Current stock" value={item.kind === "product" ? `${item.stock} ${item.unit}` : "Not tracked"} detail={statusLabel} />
          <Metric label="Inventory value" value={item.kind === "product" ? formatMoney(item.stock * item.cost) : "—"} detail="At current purchase cost" />
          <Metric label="Purchase cost" value={item.kind === "product" ? formatMoney(item.cost) : "—"} detail="Per unit" />
          <Metric label="Selling price" value={formatMoney(item.price)} detail={`${item.unit} price`} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
          <article className="card-shadow overflow-hidden rounded-2xl border border-[#e5e8ed] bg-white">
            <div className="flex items-center justify-between border-b border-[#eceef2] px-5 py-4"><div><h2 className="heading text-[15px] font-extrabold text-[#25344d]">Stock movement ledger</h2><p className="mt-1 text-[11px] text-[#8b94a2]">Immutable history for every quantity change</p></div><button className="text-[11px] font-bold text-[#3157be]">Export CSV</button></div>
            {item.movements.length ? (
              <div className="divide-y divide-[#eff1f4]">
                {item.movements.map((movement) => {
                  const delta = movementDelta(movement);
                  return (
                    <div key={movement.id} className="flex items-start gap-3 px-5 py-4">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{delta > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold capitalize text-[#344258]">{movement.kind.replace("_", " ")}</p><span className="text-[10px] font-bold text-[#99a1ad]">{movement.reference}</span></div><p className="mt-1 text-[11px] text-[#7e8898]">{movement.note || "No additional note"}</p><div className="mt-2 flex flex-wrap gap-4 text-[10px] text-[#9aa2ae]"><span className="inline-flex items-center gap-1"><Clock3 size={11} />{movement.occurredAt}</span><span className="inline-flex items-center gap-1"><UserRound size={11} />{movement.actor}</span></div></div>
                      <span className={`text-xs font-extrabold ${delta > 0 ? "text-emerald-700" : "text-amber-700"}`}>{delta > 0 ? "+" : "−"}{Math.abs(delta)} {item.unit}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f1f4f8] text-[#76849a]"><FileText size={21} /></span><p className="mt-4 text-xs font-extrabold text-[#435169]">No stock movements</p><p className="mt-1 text-[11px] text-[#929aa7]">Services do not track stock, or this product has no history yet.</p></div></div>
            )}
          </article>

          <aside className="space-y-5">
            <article className="card-shadow rounded-2xl border border-[#e5e8ed] bg-white p-5"><h2 className="heading text-[14px] font-extrabold text-[#25344d]">Stock controls</h2><dl className="mt-4 space-y-3 text-xs"><Detail label="Low-stock alert" value={item.kind === "product" ? `${item.lowStockAt} ${item.unit}` : "Not applicable"} /><Detail label="Negative stock" value="Blocked" /><Detail label="Costing method" value="Weighted average" /><Detail label="Tracking" value={item.kind === "product" ? "Enabled" : "Disabled"} /></dl></article>
            <article className="rounded-2xl border border-[#dfe6f8] bg-[#f2f5ff] p-5"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#4163bd]"><ShieldCheck size={17} /></span><h3 className="mt-4 text-xs font-extrabold text-[#344c87]">Audit-safe inventory</h3><p className="mt-2 text-[11px] leading-5 text-[#67769c]">Balances are derived from movements. Corrections create a new adjustment instead of editing history.</p></article>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="card-shadow rounded-2xl border border-[#e5e8ed] bg-white p-5"><p className="text-[11px] font-bold text-[#858f9e]">{label}</p><p className="heading mt-2 text-xl font-extrabold text-[#223149]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{detail}</p></article>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[#eff1f4] pb-3 last:border-0 last:pb-0"><dt className="text-[#85909f]">{label}</dt><dd className="font-extrabold text-[#45536a]">{value}</dd></div>;
}
