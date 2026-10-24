import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, ExternalLink, File, Flag, Link2, MessageSquareText, Paperclip, Plus, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { findProject, projects } from "@/lib/crm/demo-data";
import { projectProgress } from "@/lib/crm/rules";
import { formatMoney } from "@/lib/inventory/rules";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = findProject(id);
  if (!project) notFound();
  const progress = projectProgress(project);

  return <AppShell><div className="mx-auto max-w-[1450px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
    <Link href="/projects" className="inline-flex items-center gap-2 text-xs font-bold text-[#6f7a8c] hover:text-[#3157be]"><ArrowLeft size={15} /> Back to projects</Link>
    <header className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><h1 className="heading text-2xl font-extrabold text-[#17263f]">{project.title}</h1><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold capitalize text-emerald-700">{project.status.replace("_", " ")}</span></div><p className="mt-2 text-xs font-semibold text-[#8490a0]">{project.clientName} · {formatMoney(project.budget)} budget · due {project.dueDate}</p></div><button className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={15} /> Add task</button></header>

    <section className="mt-6 grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
      <div className="space-y-5">
        <article className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#939ca9]">Overall progress</p><p className="heading mt-2 text-3xl font-extrabold text-[#23324a]">{progress}%</p></div><p className="text-[10px] font-bold text-[#7b8798]">{project.tasks.filter((item) => item.status === "done").length} of {project.tasks.length} tasks complete</p></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full bg-gradient-to-r from-[#246bfd] to-[#7c98f6]" style={{ width: `${progress}%` }} /></div></article>

        <article className="card-shadow overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"><div className="flex items-center justify-between border-b border-[#eceef2] px-5 py-4"><div><h2 className="text-sm font-extrabold text-[#2a394f]">Tasks</h2><p className="mt-1 text-[10px] text-[#8e97a4]">Delivery work and client review</p></div></div><div className="divide-y divide-[#eff1f4]">{project.tasks.map((task) => <div key={task.id} className="flex items-start gap-3 px-5 py-4">{task.status === "done" ? <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} /> : <Circle className="mt-0.5 text-[#aab2bf]" size={18} />}<div className="min-w-0 flex-1"><p className={cn("text-xs font-extrabold", task.status === "done" ? "text-[#85909f] line-through" : "text-[#35435a]")}>{task.title}</p><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[#929aa7]"><span className="inline-flex items-center gap-1"><UserRound size={11} /> {task.assignee}</span><span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {task.dueDate}</span></div></div><span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-[9px] font-extrabold capitalize text-[#627086]">{task.status.replace("_", " ")}</span></div>)}</div></article>

        <div className="grid gap-5 xl:grid-cols-2">
          <article className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#2a394f]">Deliverables</h2><button className="text-[10px] font-extrabold text-[#3157be]">Add file</button></div><div className="mt-4 space-y-3">{project.deliverables.length ? project.deliverables.map((item) => <a key={item.id} href={item.location} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#e8ebef] p-3"><span className="grid size-9 place-items-center rounded-lg bg-[#eef2ff] text-[#4562b2]">{item.kind === "file" ? <File size={15} /> : <ExternalLink size={15} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-extrabold text-[#425068]">{item.name}</span><span className="mt-1 block text-[9px] text-[#929aa7]">Version {item.version} · {item.status}</span></span></a>) : <Empty icon={Paperclip} text="No deliverables yet" />}</div></article>
          <article className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#2a394f]">Revision requests</h2><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-extrabold text-amber-700">{project.revisions.filter((item) => item.status === "open").length} open</span></div><div className="mt-4 space-y-3">{project.revisions.length ? project.revisions.map((item) => <div key={item.id} className="rounded-xl border border-[#f0e4c7] bg-[#fffaf0] p-4"><p className="text-[11px] font-semibold leading-5 text-[#645b49]">{item.request}</p><p className="mt-2 text-[9px] font-bold text-[#9b8c6f]">Requested {item.requestedAt}</p></div>) : <Empty icon={MessageSquareText} text="No revision requests" />}</div></article>
        </div>
      </div>

      <aside className="space-y-5">
        <article className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><h2 className="text-sm font-extrabold text-[#2a394f]">Milestones</h2><div className="relative mt-5 space-y-5 before:absolute before:bottom-2 before:left-[8px] before:top-2 before:w-px before:bg-[#dfe4eb]">{project.milestones.length ? project.milestones.map((item) => <div key={item.id} className="relative flex gap-3"><span className={cn("relative z-10 mt-0.5 grid size-[17px] place-items-center rounded-full border-2 bg-white", item.completed ? "border-emerald-500" : "border-[#bdc5d1]")}>{item.completed && <span className="size-1.5 rounded-full bg-emerald-500" />}</span><div><p className="text-[11px] font-extrabold text-[#435169]">{item.title}</p><p className="mt-1 text-[9px] text-[#929ba8]">{item.dueDate}</p></div></div>) : <Empty icon={Flag} text="No milestones yet" />}</div></article>
        <article className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#2a394f]">Project links</h2><Link2 size={15} className="text-[#8f99a7]" /></div><div className="mt-4 space-y-2">{project.links.length ? project.links.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-[#e7eaef] px-3 py-3 text-[11px] font-bold text-[#526177]"><span>{item.label}</span><ExternalLink size={13} /></a>) : <Empty icon={Link2} text="No external links" />}</div></article>
        <article className="rounded-2xl border border-[#dfe6f8] bg-[#f2f5ff] p-5"><Flag size={18} className="text-[#4163bd]" /><h3 className="mt-3 text-xs font-extrabold text-[#344c87]">Project audit trail</h3><p className="mt-2 text-[10px] leading-5 text-[#68779c]">Proposal, client, task, revision and deliverable activity remains linked for future billing and reporting.</p></article>
      </aside>
    </section>
  </div></AppShell>;
}

function Empty({ icon: Icon, text }: { icon: typeof Paperclip; text: string }) { return <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-[#dce1e8] text-center"><div><Icon className="mx-auto text-[#a0a8b4]" size={17} /><p className="mt-2 text-[10px] font-semibold text-[#949ca8]">{text}</p></div></div>; }
