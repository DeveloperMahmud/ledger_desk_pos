"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { projects as previewProjects } from "@/lib/crm/demo-data";
import { loadLiveProjects } from "@/lib/crm/repository";
import type { Project } from "@/lib/crm/types";
import { projectProgress } from "@/lib/crm/rules";
import { formatMoney } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const statusStyle = { planning: "bg-sky-50 text-sky-700", active: "bg-emerald-50 text-emerald-700", review: "bg-violet-50 text-violet-700", completed: "bg-slate-100 text-slate-700", on_hold: "bg-amber-50 text-amber-700" };

export function ProjectsDashboard() {
  const [projects,setProjects]=useState<Project[]>(previewProjects);const [dataMode,setDataMode]=useState<"preview"|"loading"|"live"|"error">(isSupabaseConfigured()?"loading":"preview");const [error,setError]=useState("");
  useEffect(()=>{if(!isSupabaseConfigured())return;let active=true;loadLiveProjects().then(rows=>{if(active){setProjects(rows);setDataMode("live");}}).catch(reason=>{if(active){setError(reason instanceof Error?reason.message:"Projects could not be loaded.");setDataMode("error");}});return()=>{active=false;};},[]);
  const active = projects.filter((project) => project.status !== "completed").length;
  const portfolio = projects.reduce((sum, project) => sum + project.budget, 0);
  return <div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Client delivery</p><h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f] sm:text-[30px]">Projects</h1><p className="mt-1.5 text-sm text-[#7b8596]">Track every milestone, task, file and client revision. <span className="ml-1 text-[9px] font-extrabold uppercase">{dataMode}</span></p></div><Link href="/proposals" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={16} /> Start from proposal</Link></header>
    {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={BriefcaseBusiness} label="Active projects" value={String(active)} detail="Planning through client review" tone="blue" /><Metric icon={CircleDollarSign} label="Portfolio value" value={formatMoney(portfolio)} detail="Across current projects" tone="violet" /><Metric icon={Clock3} label="Due this month" value="2" detail="Prioritize delivery and review" tone="amber" /><Metric icon={CheckCircle2} label="Tasks completed" value="40%" detail="Overall active workload" tone="green" /></section>
    <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => {
      const progress = projectProgress(project);
      const openRevisions = project.revisions.filter((item) => item.status === "open").length;
      return <Link href={`/projects/${project.id}`} key={project.id} className="card-shadow group rounded-2xl border border-[#e4e7ec] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#aabcf3]"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[#dce7ff] to-[#9eb5ef] text-[#31539e]"><BriefcaseBusiness size={19} /></span><span className={cn("rounded-full px-2.5 py-1 text-[9px] font-extrabold capitalize", statusStyle[project.status])}>{project.status.replace("_", " ")}</span></div><h2 className="mt-4 text-sm font-extrabold text-[#28374d]">{project.title}</h2><p className="mt-1 text-[11px] font-semibold text-[#8993a1]">{project.clientName}</p><div className="mt-5"><div className="flex items-center justify-between text-[10px] font-bold text-[#778397]"><span>Project progress</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full bg-[#246bfd]" style={{ width: `${progress}%` }} /></div></div><div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-[#f7f8fa] p-3 text-center"><Small label="Budget" value={formatMoney(project.budget)} /><Small label="Due" value={project.dueDate.split(" 2026")[0]} /><Small label="Revisions" value={String(openRevisions)} /></div><div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#8791a0]"><span className="inline-flex items-center gap-1"><Users size={12} /> {project.tasks.length} tasks</span><span className="inline-flex items-center gap-1 text-[#3157be]">Open workspace <ArrowRight size={13} /></span></div></Link>;
    })}</section>
  </div>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof CalendarDays; label: string; value: string; detail: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
  return <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}><Icon size={18} /></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[23px] font-extrabold text-[#1b2a42]">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{detail}</p></article>;
}
function Small({ label, value }: { label: string; value: string }) { return <div><span className="block text-[8px] font-bold uppercase tracking-wide text-[#9aa2ae]">{label}</span><span className="mt-1 block truncate text-[10px] font-extrabold text-[#445269]">{value}</span></div>; }
