"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Settings2 } from "lucide-react";
import { inventoryItems } from "@/lib/inventory/demo-data";
import { formatMoney } from "@/lib/inventory/rules";

export function LabelSheet() {
  const products = inventoryItems.filter((item) => item.kind === "product");
  return (
    <div className="min-h-screen bg-[#eef1f5] py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-5 flex max-w-[900px] flex-col justify-between gap-3 px-4 sm:flex-row sm:items-center">
        <div><Link href="/inventory" className="inline-flex items-center gap-2 text-xs font-bold text-[#657186]"><ArrowLeft size={14} /> Back to inventory</Link><h1 className="heading mt-2 text-xl font-extrabold text-[#17263f]">A4 product labels</h1><p className="mt-1 text-[11px] text-[#838d9c]">12 labels · 3 columns · suitable for inkjet or laser printing</p></div>
        <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-xl border border-[#dce1e8] bg-white px-4 py-2.5 text-xs font-bold text-[#536074]"><Settings2 size={14} /> Layout</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Printer size={14} /> Print sheet</button></div>
      </div>

      <main className="mx-auto grid min-h-[297mm] w-[210mm] grid-cols-3 content-start gap-[4mm] bg-white p-[10mm] shadow-xl print:shadow-none">
        {[...products, ...products, ...products].slice(0, 12).map((item, index) => (
          <article key={`${item.id}-${index}`} className="flex h-[44mm] flex-col justify-between overflow-hidden rounded-[3mm] border border-[#d9dee6] p-[4mm]">
            <div className="flex items-start justify-between gap-2"><div><p className="text-[8pt] font-extrabold leading-tight text-[#17263f]">{item.name}</p><p className="mt-1 text-[6.5pt] font-semibold text-[#7f8998]">{item.sku}</p></div><span className="grid size-[9mm] shrink-0 place-items-center rounded-[2mm] bg-[#17263f] text-[6pt] font-black text-white">NS</span></div>
            <div className="flex items-end justify-between gap-2"><div><p className="text-[6pt] font-bold uppercase tracking-wide text-[#8a94a3]">Price</p><p className="mt-0.5 text-[12pt] font-black text-[#17263f]">{formatMoney(item.price)}</p></div><div className="space-y-[1.2mm]" aria-label={`Barcode placeholder ${item.sku}`}>{[34, 23, 31, 19, 29].map((width, bar) => <span key={bar} className="block h-[.6mm] bg-[#17263f]" style={{ width: `${width}mm` }} />)}</div></div>
          </article>
        ))}
      </main>
    </div>
  );
}
