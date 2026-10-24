import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Box,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  MoreHorizontal,
  PackageOpen,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

const stats = [
  { label: "Revenue", value: "৳ 284,500", note: "+12.8% vs last month", icon: CircleDollarSign, tone: "blue", up: true },
  { label: "Outstanding", value: "৳ 76,200", note: "4 invoices awaiting", icon: Clock3, tone: "amber", up: false },
  { label: "Inventory value", value: "৳ 421,840", note: "+5.2% this month", icon: Box, tone: "violet", up: true },
  { label: "Active clients", value: "38", note: "+6 new this month", icon: Users, tone: "green", up: true },
];

const activity = [
  { title: "Invoice #INV-2026-018 was paid", detail: "Orbiton Labs · ৳ 42,000", time: "12 min ago", icon: FileCheck2, color: "bg-emerald-50 text-emerald-700" },
  { title: "Stock adjusted for Premium Paper", detail: "Added 80 sheets · manual adjustment", time: "1 hr ago", icon: PackageOpen, color: "bg-blue-50 text-blue-700" },
  { title: "Payment reminder scheduled", detail: "Meridian Co. · Invoice #017", time: "3 hrs ago", icon: Clock3, color: "bg-amber-50 text-amber-700" },
];

export function Dashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
      <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold text-[#7a8495]">Saturday, 24 October</p>
          <h1 className="heading text-2xl font-extrabold tracking-[-.03em] text-[#17263f] sm:text-[30px]">Good evening, Mahmudul</h1>
          <p className="mt-1.5 text-sm text-[#7b8596]">Here&apos;s a clear view of your business today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#687386]">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_#dff7ed]" />
          Last synced just now
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5">
            <div className="mb-5 flex items-start justify-between">
              <span className={`grid size-10 place-items-center rounded-xl ${
                stat.tone === "blue" ? "bg-blue-50 text-blue-700" :
                stat.tone === "amber" ? "bg-amber-50 text-amber-700" :
                stat.tone === "violet" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
              }`}>
                <stat.icon size={19} />
              </span>
              <button className="rounded-lg p-1 text-[#a3aab5] hover:bg-[#f3f4f6]"><MoreHorizontal size={18} /></button>
            </div>
            <p className="text-xs font-semibold text-[#7d8797]">{stat.label}</p>
            <p className="heading mt-1.5 text-[24px] font-extrabold tracking-[-.03em] text-[#1b2a42]">{stat.value}</p>
            <p className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${stat.tone === "amber" ? "text-amber-700" : "text-emerald-700"}`}>
              {stat.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {stat.note}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_.85fr]">
        <article className="card-shadow overflow-hidden rounded-2xl border border-[#e7e9ee] bg-white">
          <div className="flex items-center justify-between border-b border-[#eceef2] px-5 py-4 sm:px-6">
            <div>
              <h2 className="heading text-[15px] font-extrabold text-[#20304a]">Revenue overview</h2>
              <p className="mt-1 text-[11px] text-[#8b94a2]">Invoice revenue across the last six months</p>
            </div>
            <select className="rounded-lg border border-[#e1e5eb] bg-white px-3 py-2 text-[11px] font-bold text-[#566276] outline-none">
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="px-5 pb-5 pt-7 sm:px-6">
            <div className="flex h-[230px] items-end gap-3 border-b border-[#e8ebef] sm:gap-6">
              {[42, 55, 49, 68, 63, 84].map((height, index) => (
                <div key={height} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div className="relative flex-1 rounded-t-lg bg-[#f2f5fa]">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-gradient-to-t from-[#246bfd] to-[#7399ff] shadow-[0_-5px_20px_rgba(36,107,253,.12)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="pb-2 text-center text-[10px] font-semibold text-[#8b95a4]">{["May", "Jun", "Jul", "Aug", "Sep", "Oct"][index]}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="heading text-[15px] font-extrabold text-[#20304a]">Inventory health</h2>
              <p className="mt-1 text-[11px] text-[#8b94a2]">Items that need attention</p>
            </div>
            <Box size={20} className="text-[#8090a7]" />
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-red-800"><TriangleAlert size={16} /> 3 items out of stock</div>
              <p className="mt-1.5 text-[11px] text-red-700/70">Immediate restock recommended</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800"><PackageOpen size={16} /> 7 items running low</div>
              <p className="mt-1.5 text-[11px] text-amber-700/70">Below their preferred threshold</p>
            </div>
          </div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e1e5eb] py-2.5 text-xs font-bold text-[#41506a] hover:bg-[#f6f8fb]">
            Review inventory <ArrowRight size={14} />
          </button>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
        <article className="card-shadow rounded-2xl border border-[#e7e9ee] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="heading text-[15px] font-extrabold text-[#20304a]">Recent activity</h2>
              <p className="mt-1 text-[11px] text-[#8b94a2]">A transparent audit trail of your workspace</p>
            </div>
            <button className="text-[11px] font-bold text-[#246bfd]">View all</button>
          </div>
          <div className="mt-4 divide-y divide-[#eff1f4]">
            {activity.map((item) => (
              <div key={item.title} className="flex gap-3 py-4">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${item.color}`}><item.icon size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#334157]">{item.title}</p>
                  <p className="mt-1 truncate text-[11px] text-[#8992a1]">{item.detail}</p>
                </div>
                <time className="whitespace-nowrap text-[10px] font-medium text-[#a0a7b2]">{item.time}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-[#192a46] p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-[#4567f4]/25 blur-2xl" />
          <div className="absolute -bottom-24 left-20 size-56 rounded-full bg-[#52c5ae]/10 blur-2xl" />
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10"><Sparkles size={19} /></span>
            <h2 className="heading mt-8 max-w-sm text-xl font-extrabold leading-snug tracking-[-.02em]">Finish your workspace setup</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-slate-300">Set your business identity, accounting mode, invoice style and default currency. You can change everything later.</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/3 rounded-full bg-[#7ea0ff]" /></div>
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400"><span>1 of 3 sections</span><span>33%</span></div>
            <Link href="/setup" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#20304a] transition hover:bg-[#eef2ff]">
              Continue setup <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dde6ff] bg-[#edf2ff] px-5 py-4 text-[#304d91]">
        <Banknote size={18} />
        <p className="flex-1 text-xs"><strong className="font-extrabold">Free-first pilot mode.</strong> Connect Supabase when you are ready; no credential is stored in this preview.</p>
      </section>
    </div>
  );
}
