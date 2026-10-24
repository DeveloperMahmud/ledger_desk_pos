import type { Invoice, InvoiceTemplate } from "@/lib/invoicing/types";
import { invoiceTotals } from "@/lib/invoicing/rules";
import { formatMoney } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";

const templateStyles: Record<InvoiceTemplate, { accent: string; header: string; table: string }> = {
  modern: { accent: "#246bfd", header: "bg-[#17263f] text-white", table: "bg-[#edf2ff] text-[#344f92]" },
  classic: { accent: "#8b5e3c", header: "border-b-4 border-double border-[#8b5e3c] text-[#33261e]", table: "bg-[#f5eee8] text-[#62452f]" },
  minimal: { accent: "#111827", header: "border-b border-[#d8dde5] text-[#172033]", table: "bg-[#f4f5f7] text-[#4b5563]" },
};

export function InvoiceDocument({ invoice, publicView = false }: { invoice: Invoice; publicView?: boolean }) {
  const totals = invoiceTotals(invoice);
  const style = templateStyles[invoice.template];
  return <article className="invoice-paper mx-auto w-full max-w-[850px] bg-white shadow-xl print:max-w-none print:shadow-none">
    <header className={cn("flex flex-col justify-between gap-8 p-8 sm:flex-row sm:p-10", style.header)}>
      <div><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-white/15 text-sm font-black">NS</span><div><h1 className="heading text-xl font-extrabold">Northstar Studio</h1><p className="mt-1 text-[10px] opacity-70">Digital services & creative production</p></div></div><p className="mt-6 max-w-xs text-[10px] leading-5 opacity-70">Dhaka, Bangladesh · hello@northstar.example<br />+880 17 0000 0000</p></div>
      <div className="sm:text-right"><p className="text-[10px] font-bold uppercase tracking-[.2em] opacity-60">Invoice</p><p className="heading mt-2 text-2xl font-extrabold">{invoice.number}</p><p className="mt-3 text-[10px] opacity-75">Issued {invoice.issueDate}<br />Due {invoice.dueDate}</p></div>
    </header>
    <div className="p-8 sm:p-10">
      <section className="flex flex-col justify-between gap-6 sm:flex-row"><div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#969eaa]">Bill to</p><h2 className="mt-2 text-sm font-extrabold text-[#29384e]">{invoice.clientName}</h2><p className="mt-1 text-[11px] text-[#788496]">{invoice.clientEmail}</p></div><div className="sm:text-right"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#969eaa]">For</p><p className="mt-2 text-xs font-extrabold text-[#3c4a60]">{invoice.title}</p><span className="mt-2 inline-block rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize" style={{ backgroundColor: `${style.accent}14`, color: style.accent }}>{invoice.status.replace("_", " ")}</span></div></section>
      <table className="mt-8 w-full border-collapse text-left"><thead><tr className={cn("text-[9px] font-extrabold uppercase tracking-[.08em]", style.table)}><th className="px-3 py-3">Description</th><th className="px-3 py-3 text-center">Qty</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-[#eceff3]">{invoice.lines.map((line) => <tr key={line.id}><td className="px-3 py-4"><p className="text-[11px] font-extrabold text-[#37455a]">{line.description}</p><p className="mt-1 text-[9px] capitalize text-[#929ba8]">{line.kind} · per {line.unit}</p></td><td className="px-3 py-4 text-center text-[11px] font-semibold text-[#667286]">{line.quantity}</td><td className="px-3 py-4 text-right text-[11px] font-semibold text-[#667286]">{formatMoney(line.unitPrice)}</td><td className="px-3 py-4 text-right text-[11px] font-extrabold text-[#344258]">{formatMoney(line.quantity * line.unitPrice - line.discount)}</td></tr>)}</tbody></table>
      <section className="mt-6 flex justify-end"><dl className="w-full max-w-xs space-y-2 text-[11px]"><Row label="Subtotal" value={formatMoney(totals.subtotal)} />{totals.lineDiscount > 0 && <Row label="Discount" value={`− ${formatMoney(totals.lineDiscount)}`} />}<Row label="Tax" value={formatMoney(totals.tax)} /><div className="my-3 border-t border-[#dfe3e9]" /><Row label="Total" value={formatMoney(totals.total)} strong /><Row label="Paid" value={formatMoney(totals.paid)} /><div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${style.accent}10` }}><Row label="Amount due" value={formatMoney(totals.due)} strong color={style.accent} /></div></dl></section>
      <section className="mt-10 grid gap-6 border-t border-[#e5e8ed] pt-6 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#969eaa]">Payment instructions</p><p className="mt-2 text-[10px] leading-5 text-[#687487]">Bank, cash or online-bank payment can be recorded manually. Please include the invoice number as reference.</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#969eaa]">Terms & notes</p><p className="mt-2 text-[10px] leading-5 text-[#687487]">{invoice.terms || invoice.notes || "Thank you for your business."}</p></div></section>
      {publicView && <p className="mt-8 rounded-xl bg-[#f4f7fb] px-4 py-3 text-center text-[9px] font-semibold text-[#718096]">Secure online invoice · Payment instructions are provided by Northstar Studio.</p>}
    </div>
  </article>;
}

function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) { return <div className="flex items-center justify-between gap-4"><dt className={cn("text-[#7e8999]", strong && "font-extrabold text-[#3a485d]")}>{label}</dt><dd className={cn("text-right font-semibold text-[#48566b]", strong && "text-sm font-extrabold")} style={{ color }}>{value}</dd></div>; }
