"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Banknote, CircleDollarSign, FileText, Plus, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { invoices as previewInvoices } from "@/lib/invoicing/demo-data";
import { loadLiveInvoices } from "@/lib/invoicing/repository";
import { invoiceTotals } from "@/lib/invoicing/rules";
import type { Invoice } from "@/lib/invoicing/types";
import { formatMoney } from "@/lib/inventory/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const statusStyles = { draft: "bg-slate-100 text-slate-700", issued: "bg-blue-50 text-blue-700", partially_paid: "bg-violet-50 text-violet-700", paid: "bg-emerald-50 text-emerald-700", overdue: "bg-red-50 text-red-700", cancelled: "bg-slate-100 text-slate-500" };

export function InvoicesDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>(previewInvoices);
  const [dataMode, setDataMode] = useState<"preview" | "loading" | "live" | "error">(isSupabaseConfigured() ? "loading" : "preview");
  const [dataError, setDataError] = useState("");
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    loadLiveInvoices().then((records) => { if (active) { setInvoices(records); setDataMode("live"); } }).catch((error) => { if (active) { setDataMode("error"); setDataError(error instanceof Error ? error.message : "Invoices could not be loaded."); } });
    return () => { active = false; };
  }, []);
  const totals = invoices.map(invoiceTotals);
  const invoiced = totals.reduce((sum, total) => sum + total.total, 0);
  const collected = totals.reduce((sum, total) => sum + total.paid, 0);
  const due = totals.reduce((sum, total) => sum + total.due, 0);
  return <div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9"><header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Billing & collection</p><h1 className="heading text-2xl font-extrabold text-[#17263f] sm:text-[30px]">Invoices</h1><p className="mt-1.5 text-sm text-[#7b8596]">Professional product, service and mixed invoices. <span className={`ml-1 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${dataMode === "live" ? "bg-emerald-50 text-emerald-700" : dataMode === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{dataMode}</span></p></div><Link href="/invoices/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={16} /> Create invoice</Link></header>
    {dataError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{dataError} Preview invoices remain visible.</p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={ReceiptText} label="Invoices" value={String(invoices.length)} note="Current billing records" tone="blue" /><Metric icon={CircleDollarSign} label="Invoiced" value={formatMoney(invoiced)} note="Gross issued and draft value" tone="violet" /><Metric icon={Banknote} label="Collected" value={formatMoney(collected)} note="Recorded manual payments" tone="green" /><Metric icon={AlertCircle} label="Outstanding" value={formatMoney(due)} note="Partial and unpaid balances" tone="amber" /></section>
    <section className="card-shadow mt-6 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"><div className="border-b border-[#eceef2] px-5 py-4"><h2 className="text-sm font-extrabold text-[#2b3a51]">Recent invoices</h2></div><div className="divide-y divide-[#eff1f4]">{invoices.length ? invoices.map((invoice) => { const total = invoiceTotals(invoice); return <Link href={`/invoices/${invoice.id}`} key={invoice.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafbfe] md:grid-cols-[1.3fr_1fr_.7fr_.7fr_auto] md:items-center"><div><p className="text-xs font-extrabold text-[#334157]">{invoice.number}</p><p className="mt-1 text-[10px] text-[#8d96a4]">{invoice.title}</p></div><div><p className="text-[11px] font-bold text-[#506076]">{invoice.clientName}</p><p className="mt-1 text-[9px] text-[#969eaa]">Due {invoice.dueDate}</p></div><p className="text-xs font-extrabold text-[#344258]">{formatMoney(total.total)}</p><span className={cn("w-fit rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize", statusStyles[invoice.status])}>{invoice.status.replace("_", " ")}</span><ArrowRight size={14} className="text-[#8e98a6]" /></Link>; }) : <p className="px-5 py-12 text-center text-xs text-[#8d96a4]">No invoices yet. Create your first professional invoice.</p>}</div></section>
  </div>;
}
function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof FileText; label: string; value: string; note: string; tone: "blue" | "violet" | "green" | "amber" }) { const colors={blue:"bg-blue-50 text-blue-700",violet:"bg-violet-50 text-violet-700",green:"bg-emerald-50 text-emerald-700",amber:"bg-amber-50 text-amber-700"}; return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl",colors[tone])}><Icon size={18}/></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[22px] font-extrabold text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{note}</p></article>; }
