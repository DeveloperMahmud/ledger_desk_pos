"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleDollarSign, Mail, Phone, Plus, Search, Sparkles, UserCheck, Users } from "lucide-react";
import { clients as initialClients, leads as initialLeads } from "@/lib/crm/demo-data";
import { convertLeadToClient } from "@/lib/crm/rules";
import type { Lead, LeadStage } from "@/lib/crm/types";
import { formatMoney } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";

const stages: { value: LeadStage; label: string; tone: string }[] = [
  { value: "new", label: "New", tone: "bg-sky-50 text-sky-700" },
  { value: "contacted", label: "Contacted", tone: "bg-indigo-50 text-indigo-700" },
  { value: "qualified", label: "Qualified", tone: "bg-violet-50 text-violet-700" },
  { value: "proposal", label: "Proposal", tone: "bg-amber-50 text-amber-700" },
];

export function CrmDashboard() {
  const [view, setView] = useState<"leads" | "clients">("leads");
  const [leadRows, setLeadRows] = useState(initialLeads);
  const [clientRows, setClientRows] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notice, setNotice] = useState("");

  const visibleClients = useMemo(() => clientRows.filter((client) => `${client.name} ${client.company} ${client.email}`.toLowerCase().includes(query.toLowerCase())), [clientRows, query]);
  const pipelineValue = leadRows.reduce((sum, lead) => sum + lead.estimatedValue, 0);

  function convertSelected() {
    if (!selected) return;
    const client = convertLeadToClient(selected);
    setClientRows((current) => [client, ...current]);
    setLeadRows((current) => current.filter((lead) => lead.id !== selected.id));
    setNotice(`${selected.company || selected.name} is now a client. Create a proposal to continue.`);
    setSelected(null);
    setView("clients");
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Relationships & sales pipeline</p><h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f] sm:text-[30px]">CRM workspace</h1><p className="mt-1.5 text-sm text-[#7b8596]">Turn enquiries into organized, billable client work.</p></div>
        <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20"><Plus size={16} /> Add lead</button>
      </header>

      {notice && <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800"><UserCheck size={17} /> {notice}</div>}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Open leads" value={String(leadRows.length)} note="Across the active pipeline" tone="blue" />
        <Stat icon={CircleDollarSign} label="Pipeline value" value={formatMoney(pipelineValue)} note="Potential project revenue" tone="violet" />
        <Stat icon={UserCheck} label="Active clients" value={String(clientRows.filter((item) => item.status === "active").length)} note="Ready for proposals and projects" tone="green" />
        <Stat icon={CalendarClock} label="Follow-ups" value="3" note="Due in the next 7 days" tone="amber" />
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-[#e0e4ea] bg-white p-1">
          {(["leads", "clients"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={cn("rounded-lg px-4 py-2 text-xs font-extrabold capitalize", view === item ? "bg-[#17263f] text-white" : "text-[#6f7b8e]")}>{item}</button>)}
        </div>
        {view === "clients" && <label className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa3b0]" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients" className="h-10 w-full rounded-xl border border-[#e0e4ea] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#8da7f9]" /></label>}
      </div>

      {view === "leads" ? (
        <section className="mt-4 grid gap-4 xl:grid-cols-4">
          {stages.map((stage) => {
            const rows = leadRows.filter((lead) => lead.stage === stage.value);
            return <article key={stage.value} className="rounded-2xl border border-[#e4e7ec] bg-[#f0f2f6]/75 p-3"><div className="flex items-center justify-between px-1 pb-3"><span className={cn("rounded-lg px-2.5 py-1 text-[10px] font-extrabold", stage.tone)}>{stage.label}</span><span className="text-[11px] font-extrabold text-[#8b94a2]">{rows.length}</span></div><div className="space-y-3">{rows.map((lead) => <button key={lead.id} onClick={() => setSelected(lead)} className="card-shadow w-full rounded-xl border border-[#e4e7ec] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#aebef2]"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eef2ff] text-xs font-black text-[#4261b5]">{lead.company.slice(0, 2).toUpperCase()}</span><span className="text-[10px] font-extrabold text-[#3157be]">{formatMoney(lead.estimatedValue)}</span></div><h3 className="mt-3 text-xs font-extrabold text-[#2d3b51]">{lead.company}</h3><p className="mt-1 text-[10px] font-semibold text-[#7f8998]">{lead.name} · {lead.service}</p><div className="mt-4 flex items-center justify-between border-t border-[#eff1f4] pt-3 text-[9px] font-bold text-[#9099a7]"><span>{lead.source}</span><span>{lead.nextFollowUp}</span></div></button>)}{!rows.length && <div className="rounded-xl border border-dashed border-[#d7dce4] p-6 text-center text-[10px] font-semibold text-[#9ba3af]">No leads here</div>}</div></article>;
          })}
        </section>
      ) : (
        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleClients.map((client) => <article key={client.id} className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#dce7ff] to-[#9cb3ef] text-xs font-black text-[#27478f]">{client.company.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold text-[#29384f]">{client.company}</h3><p className="mt-1 text-[11px] text-[#8791a0]">{client.name}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700">Active</span></div><div className="mt-5 space-y-2 text-[11px] text-[#687589]"><p className="flex items-center gap-2"><Mail size={13} /> {client.email}</p>{client.phone && <p className="flex items-center gap-2"><Phone size={13} /> {client.phone}</p>}</div><div className="mt-5 grid grid-cols-2 rounded-xl bg-[#f7f8fa] p-3 text-center"><Small label="Projects" value={String(client.projects)} /><Small label="Lifetime value" value={formatMoney(client.lifetimeValue)} /></div></article>)}
        </section>
      )}

      {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111c2d]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lead details"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#edf2ff] text-[#4261b5]"><Sparkles size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#8a94a3]">Qualified opportunity</p><h2 className="heading mt-1 text-lg font-extrabold text-[#23324a]">{selected.company}</h2></div></div><div className="mt-5 grid gap-3 rounded-xl bg-[#f7f8fa] p-4 text-xs sm:grid-cols-2"><Small label="Contact" value={selected.name} /><Small label="Service" value={selected.service} /><Small label="Potential value" value={formatMoney(selected.estimatedValue)} /><Small label="Next follow-up" value={selected.nextFollowUp} /></div><p className="mt-4 text-xs leading-5 text-[#718095]">Converting keeps this contact and creates a client profile. The next step is a professional proposal.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setSelected(null)} className="rounded-xl border border-[#dfe3e9] px-4 py-2.5 text-xs font-bold text-[#627084]">Cancel</button><button onClick={convertSelected} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><BriefcaseBusiness size={15} /> Convert to client <ArrowRight size={14} /></button></div></div></div>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, note, tone }: { icon: typeof Users; label: string; value: string; note: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
  return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}><Icon size={18} /></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[23px] font-extrabold text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{note}</p></article>;
}

function Small({ label, value }: { label: string; value: string }) { return <div><span className="block text-[9px] font-bold uppercase tracking-wide text-[#98a1ae]">{label}</span><span className="mt-1 block truncate text-[11px] font-extrabold text-[#46556b]">{value}</span></div>; }
