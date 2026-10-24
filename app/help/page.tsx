import { BookOpen, Boxes, FileText, LifeBuoy, Mail, Settings, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const guides = [
  { icon: Boxes, title: "Inventory", text: "Add products or materials, set reorder levels, adjust stock with a reason, then print labels." },
  { icon: FileText, title: "Invoices", text: "Choose product, service or mixed items; select a template; issue, share, print and record payments." },
  { icon: WalletCards, title: "Accounting", text: "Use Basic mode for income and expenses, or enable Full mode for journals and trial balance." },
  { icon: Mail, title: "Client delivery", text: "Send the secure invoice link using a professional template after SMTP is connected." },
  { icon: Settings, title: "Future modules", text: "Enable branches, POS, manufacturing or full accounting later without changing the core workspace." },
];

export default function HelpPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
        <header className="rounded-3xl bg-[#17263f] p-7 text-white sm:p-10">
          <span className="grid size-11 place-items-center rounded-xl bg-white/10"><LifeBuoy size={21} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-blue-300">Quick start</p>
          <h1 className="heading mt-2 text-3xl font-extrabold">LedgerDesk Help Center</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">The shortest path from first setup to a professional invoice and accurate business records.</p>
        </header>
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide) => <article key={guide.title} className="card-shadow rounded-2xl border border-[#e3e7ed] bg-white p-6"><span className="grid size-10 place-items-center rounded-xl bg-[#edf2ff] text-[#3d5eba]"><guide.icon size={18} /></span><h2 className="mt-5 text-sm font-extrabold text-[#304058]">{guide.title}</h2><p className="mt-2 text-xs leading-6 text-[#7b8697]">{guide.text}</p></article>)}
          <article className="card-shadow rounded-2xl border border-[#dce5ff] bg-[#f3f6ff] p-6"><BookOpen size={20} className="text-[#3d5eba]" /><h2 className="mt-5 text-sm font-extrabold text-[#304058]">Detailed Bangla guide</h2><p className="mt-2 text-xs leading-6 text-[#6f7c91]">The repository includes USER_GUIDE_BN.md with module-by-module operating instructions and QA_HANDOVER.md for final live checks.</p></article>
        </section>
      </div>
    </AppShell>
  );
}
