"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, FileCheck2, FileClock, FileSignature, Plus, Send, Sparkles } from "lucide-react";
import { proposals as previewProposals } from "@/lib/crm/demo-data";
import { canConvertProposal, createProjectFromProposal, proposalTotal } from "@/lib/crm/rules";
import { convertLiveProposal, createLiveProposal, loadLiveCrm, loadLiveProposals } from "@/lib/crm/repository";
import type { Proposal, ProposalStatus } from "@/lib/crm/types";
import { formatMoney } from "@/lib/inventory/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const statusStyle: Record<ProposalStatus, string> = { draft: "bg-slate-100 text-slate-700", sent: "bg-blue-50 text-blue-700", accepted: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700", expired: "bg-amber-50 text-amber-700" };
type Party = { id: string; name: string; type: "lead" | "client" };

export function ProposalsDashboard() {
  const [rows, setRows] = useState<Proposal[]>(previewProposals);
  const [createdProject, setCreatedProject] = useState<{ id: string; title: string } | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dataMode, setDataMode] = useState<"preview" | "loading" | "live" | "error">(isSupabaseConfigured() ? "loading" : "preview");
  const acceptedValue = rows.filter((item) => item.status === "accepted").reduce((sum, item) => sum + proposalTotal(item.items), 0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    Promise.all([loadLiveProposals(), loadLiveCrm()]).then(([proposals, crm]) => {
      if (!active) return;
      setRows(proposals);
      setParties([...crm.clients.map((item) => ({ id: item.id, name: item.company, type: "client" as const })), ...crm.leads.map((item) => ({ id: item.id, name: item.company, type: "lead" as const }))]);
      setDataMode("live");
    }).catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : "Proposals could not be loaded."); setDataMode("error"); } });
    return () => { active = false; };
  }, []);

  async function convert(proposal: Proposal) {
    setSaving(true); setError("");
    try {
      const project = createProjectFromProposal(proposal, proposal.clientId || `client-${proposal.leadId}`);
      if (dataMode === "live") project.id = await convertLiveProposal(proposal.id);
      setRows((current) => current.map((item) => item.id === proposal.id ? { ...item, projectId: project.id } : item));
      setCreatedProject({ id: project.id, title: project.title });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Project could not be created."); }
    finally { setSaving(false); }
  }

  async function addProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const party = parties.find((item) => item.id === String(form.get("party")));
    const input = { leadId: party?.type === "lead" ? party.id : undefined, clientId: party?.type === "client" ? party.id : undefined, title: String(form.get("title") || "").trim(), validUntil: String(form.get("validUntil") || ""), description: String(form.get("description") || "").trim(), quantity: Number(form.get("quantity") || 1), unitPrice: Number(form.get("unitPrice") || 0) };
    if (!party || !input.title || !input.validUntil || !input.description) { setError("Client/lead, title, validity and item are required."); return; }
    setSaving(true); setError("");
    try {
      if (dataMode === "live") { await createLiveProposal(input); setRows(await loadLiveProposals()); }
      else setRows((current) => [{ id: `preview-${Date.now()}`, number: "Preview proposal", clientName: party.name, title: input.title, status: "draft", validUntil: input.validUntil, createdAt: "Today", items: [{ id: "preview-item", description: input.description, quantity: input.quantity, unitPrice: input.unitPrice }], ...(input.clientId ? { clientId: input.clientId } : { leadId: input.leadId }) }, ...current]);
      setAdding(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Proposal could not be created."); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Sales documents</p><h1 className="heading text-2xl font-extrabold text-[#17263f] sm:text-[30px]">Proposals</h1><p className="mt-1.5 text-sm text-[#7b8596]">Price services clearly, track acceptance and start projects without re-entry. <span className="ml-1 text-[9px] font-extrabold uppercase">{dataMode}</span></p></div><button onClick={() => setAdding(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={16} /> New proposal</button></header>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
    {createdProject && <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs font-bold text-emerald-800"><Sparkles size={16} /> Project “{createdProject.title}” created with proposal value and client linked.</p><Link href={`/projects/${createdProject.id}`} className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800">Open project <ArrowRight size={14} /></Link></div>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={FileSignature} label="All proposals" value={String(rows.length)} detail="Draft, sent and accepted" tone="blue" /><Metric icon={Send} label="Awaiting decision" value={String(rows.filter((item) => item.status === "sent").length)} detail="Client follow-up required" tone="violet" /><Metric icon={FileCheck2} label="Accepted value" value={formatMoney(acceptedValue)} detail="Ready for project delivery" tone="green" /><Metric icon={FileClock} label="Expiring soon" value={String(rows.filter((item) => item.status === "sent").length)} detail="Review validity dates" tone="amber" /></section>
    <section className="card-shadow mt-6 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"><div className="border-b border-[#eceef2] px-5 py-4"><h2 className="text-sm font-extrabold text-[#2b3a51]">Proposal pipeline</h2><p className="mt-1 text-[11px] text-[#8b94a2]">Accepted proposals can be converted exactly once.</p></div><div className="divide-y divide-[#eff1f4]">{rows.map((proposal) => { const total = proposalTotal(proposal.items); return <article key={proposal.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_.8fr_.7fr_.8fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xs font-extrabold text-[#2c3a50]">{proposal.title}</h3><span className={cn("rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize", statusStyle[proposal.status])}>{proposal.status}</span></div><p className="mt-1.5 text-[10px] font-semibold text-[#8b94a2]">{proposal.number} · {proposal.clientName}</p></div><div><p className="text-[9px] font-bold uppercase text-[#9aa2ae]">Created</p><p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#59677c]"><CalendarDays size={12} /> {proposal.createdAt}</p></div><div><p className="text-[9px] font-bold uppercase text-[#9aa2ae]">Valid until</p><p className="mt-1 text-[11px] font-bold text-[#59677c]">{proposal.validUntil}</p></div><p className="text-sm font-extrabold text-[#27364d]">{formatMoney(total)}</p><div>{canConvertProposal(proposal) ? <button disabled={saving} onClick={() => convert(proposal)} className="inline-flex items-center gap-2 rounded-xl bg-[#17263f] px-4 py-2.5 text-[10px] font-extrabold text-white disabled:opacity-60"><CheckCircle2 size={14} /> Create project</button> : proposal.projectId ? <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700">Converted</span> : <span className="text-[10px] text-[#7b8697]">Awaiting acceptance</span>}</div></article>; })}</div></section>
    {adding && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111c2d]/55 p-4"><form onSubmit={addProposal} className="w-full max-w-xl rounded-2xl bg-white p-6"><h2 className="text-lg font-extrabold text-[#23324a]">Create proposal draft</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Client or lead"><select name="party" required className="input">{parties.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.type}</option>)}</select></Field><Field label="Valid until"><input name="validUntil" type="date" required className="input" /></Field><div className="sm:col-span-2"><Field label="Proposal title"><input name="title" required className="input" /></Field></div><div className="sm:col-span-2"><Field label="First item"><input name="description" required className="input" /></Field></div><Field label="Quantity"><input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" className="input" /></Field><Field label="Unit price"><input name="unitPrice" type="number" min="0" step="0.01" required className="input" /></Field></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setAdding(false)} className="rounded-xl border px-4 py-2.5 text-xs font-bold">Cancel</button><button disabled={saving} className="rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Saving..." : "Save draft"}</button></div></form></div>}
  </div>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof FileSignature; label: string; value: string; detail: string; tone: "blue" | "violet" | "green" | "amber" }) { const colors = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" }; return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}><Icon size={18} /></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[23px] font-extrabold text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{detail}</p></article>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-xs font-bold text-[#46556b]">{label}</span>{children}</label>; }
