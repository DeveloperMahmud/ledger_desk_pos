"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  FileText,
  FileSignature,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Search,
  Settings,
  Sparkles,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Inventory", icon: Boxes, href: "/inventory" },
  { label: "Invoices", icon: FileText, href: "/invoices", badge: "4" },
  { label: "Clients", icon: Users, href: "/clients" },
  { label: "Proposals", icon: FileSignature, href: "/proposals" },
  { label: "Projects", icon: BriefcaseBusiness, href: "/projects" },
  { label: "Accounting", icon: WalletCards, href: "/accounting" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const searchResults = navigation.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="flex min-h-screen">
        {open && (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-[#0e1726]/45 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/8 bg-[#17263f] text-white transition-transform lg:sticky lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-20 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <span className="grid size-10 place-items-center rounded-xl bg-[#6d8dff] shadow-lg shadow-blue-950/30">
                <Sparkles size={20} strokeWidth={2.5} />
              </span>
              <span>
                <span className="heading block text-[17px] font-extrabold tracking-tight">LedgerDesk</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Business OS</span>
              </span>
            </Link>
            <button className="rounded-lg p-2 text-slate-400 lg:hidden" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="mx-4 mb-5 rounded-xl border border-white/10 bg-white/[.06] p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#dbe4ff] text-xs font-black text-[#27478f]">NS</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">Northstar Studio</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Agency workspace</p>
              </div>
              <ChevronDown size={15} className="text-slate-400" />
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</p>
            {navigation.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition",
                  active
                    ? "bg-white/[.1] text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/[.06] hover:text-white",
                )}
              >
                <item.icon size={18} strokeWidth={active ? 2.4 : 2} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="rounded-full bg-[#e2e9ff] px-2 py-0.5 text-[10px] font-bold text-[#304f9d]">{item.badge}</span>}
              </Link>
            )})}
          </nav>

          <div className="space-y-1 border-t border-white/10 p-3">
            <Link href="/help" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-slate-400 hover:bg-white/[.06] hover:text-white">
              <CircleHelp size={18} /> Help center
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-slate-400 hover:bg-white/[.06] hover:text-white">
              <Settings size={18} /> Settings
            </Link>
            <Link href="/login" className="mt-3 flex items-center gap-3 rounded-xl bg-[#0f1d32] p-3 transition hover:bg-[#12243d]">
              <div className="grid size-9 place-items-center rounded-full bg-[#f0b47a] text-xs font-extrabold text-[#55300f]">MH</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">Mahmudul Hassan</p>
                <p className="text-[10px] text-slate-500">Business owner</p>
              </div>
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-[#e9ebf0] bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <button aria-label="Open navigation" className="rounded-xl border border-[#e1e5eb] p-2.5 text-[#465469] lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={19} />
            </button>
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa3b2]" size={17} />
              <input
                aria-label="Search workspace pages"
                className="h-10 w-full rounded-xl border border-[#e5e8ed] bg-[#f8f9fb] pl-10 pr-4 text-xs outline-none transition focus:border-[#93aaf8] focus:bg-white focus:ring-4 focus:ring-[#dfe7ff]/60"
                placeholder="Search invoices, products, clients..."
                value={search}
                onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => { if (event.key === "Escape") setSearchOpen(false); }}
              />
              {searchOpen && search.trim() && (
                <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-[#e1e5eb] bg-white p-2 shadow-xl" role="listbox">
                  {searchResults.length ? searchResults.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => { setSearch(""); setSearchOpen(false); }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold text-[#526077] hover:bg-[#f1f5ff]">
                      <item.icon size={15} /> {item.label}
                    </Link>
                  )) : <p className="px-3 py-4 text-center text-xs text-[#8b95a4]">No matching workspace page</p>}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/setup" className="hidden rounded-xl border border-[#dfe3e9] px-4 py-2.5 text-xs font-bold text-[#324258] transition hover:bg-[#f6f7f9] sm:inline-flex">
                Workspace setup
              </Link>
              <Link href="/invoices/new" className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#195ee8]">
                <PackagePlus size={16} /> <span className="hidden sm:inline">New invoice</span>
              </Link>
            </div>
          </header>
          <div id="main-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
