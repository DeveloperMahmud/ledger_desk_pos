"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, FileCheck2, FileClock, FileSignature, Plus, Send, Sparkles } from "lucide-react";
import { proposals as initialProposals } from "@/lib/crm/demo-data";
import { canConvertProposal, createProjectFromProposal, proposalTotal } from "@/lib/crm/rules";
import type { Proposal, ProposalStatus } from "@/lib/crm/types";
import { formatMoney } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";

const statusStyle: Record<ProposalStatus, string> = { draft: "bg-slate-100 text-slate-700", sent: "bg-blue-50 text-blue-700", accepted: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700", expired: "bg-amber-50 text-amber-700" };

export function ProposalsDashboard() {
  const [rows, setRows] = useState(initialProposals);
  const [createdProject, setCreatedProject] = useState<{ id: string; title: string } | null>(null);
  const acceptedValue = rows.filter((item) => item.status === "accepted").reduce((sum, item) => sum + proposalTotal(item.items), 0);

  function convert(proposal: Proposal) {
    const project = createProjectFromProposal(proposal, proposal.clientId || `client-${proposal.leadId}`);
    setRows((current) => current.map((item) => item.id === proposal.id ? { ...item, projectId: project.id } : item));
    setCreatedProject({ id: project.id, title: project.title });
  }

  return <div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Sales documents</p><h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f] sm:text-[30px]">Proposals</h1><p className="mt-1.5 text-sm text-[#7b8596]">Price services clearly, track acceptance and start projects without re-entry.</p></div><button className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={16} /> New proposal</button></header>

    {createdProject && <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs font-bold text-emerald-800"><Sparkles size={16} /> Project “{createdProject.title}” created with proposal value and client linked.</p><Link href="/projects" className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800">Open projects <ArrowRight size={14} /></Link></div>}

    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={FileSignature} label="All proposals" value={String(rows.length)} detail="Draft, sent and accepted" tone="blue" /><Metric icon={Send} label="Awaiting decision" value={String(rows.filter((item) => item.status === "sent").length)} detail="Client follow-up required" tone="violet" /><Metric icon={FileCheck2} label="Accepted value" value={formatMoney(acceptedValue)} detail="Ready for project delivery" tone="green" /><Metric icon={FileClock} label="Expiring soon" value="1" detail="Within the next 7 days" tone="amber" /></section>

    <section className="card-shadow mt-6 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
      <div className="border-b border-[#eceef2] px-5 py-4"><h2 className="text-sm font-extrabold text-[#2b3a51]">Proposal pipeline</h2><p className="mt-1 text-[11px] text-[#8b94a2]">Accepted proposals can be converted exactly once.</p></div>
      <div className="divide-y divide-[#eff1f4]">{rows.map((proposal) => {
        const total = proposalTotal(proposal.items);
        return <article key={proposal.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_.8fr_.7fr_.8fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-extrabold text-[#2c3a50]">{proposal.title}</h3><span className={cn("rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize", statusStyle[proposal.status])}>{proposal.status}</span></div><p className="mt-1.5 text-[10px] font-semibold text-[#8b94a2]">{proposal.number} · {proposal.clientName}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-[#9aa2ae]">Created</p><p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#59677c]"><CalendarDays size={12} /> {proposal.createdAt}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-[#9aa2ae]">Valid until</p><p className="mt-1 text-[11px] font-bold text-[#59677c]">{proposal.validUntil}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-[#9aa2ae]">Total</p><p className="mt-1 text-sm font-extrabold text-[#27364d]">{formatMoney(total)}</p></div><div>{canConvertProposal(proposal) ? <button onClick={() => convert(proposal)} className="inline-flex items-center gap-2 rounded-xl bg-[#17263f] px-4 py-2.5 text-[10px] font-extrabold text-white"><CheckCircle2 size={14} /> Create project</button> : proposal.projectId ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700"><CheckCircle2 size={13} /> Converted</span> : <button className="rounded-xl border border-[#e0e4ea] px-4 py-2.5 text-[10px] font-bold text-[#657286]">Open</button>}</div></article>;
      })}</div>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof FileSignature; label: string; value: string; detail: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
  return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}><Icon size={18} /></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[23px] font-extrabold text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{detail}</p></article>;
}
