"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, BookOpenCheck, Building2, CircleDollarSign, Landmark, Plus, Scale, WalletCards, X } from "lucide-react";
import { basicTransactions, journalEntries, ledgerAccounts, moneyAccounts } from "@/lib/accounting/demo-data";
import { loadLiveAccounting, recordLiveTransaction } from "@/lib/accounting/repository";
import { profitAndLoss, trialBalance } from "@/lib/accounting/rules";
import type { AccountingMode, BasicTransaction } from "@/lib/accounting/types";
import { formatMoney } from "@/lib/inventory/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export function AccountingDashboard() {
  const [mode, setMode] = useState<AccountingMode>("basic");
  const [transactions, setTransactions] = useState(basicTransactions);
  const [accounts, setAccounts] = useState(moneyAccounts);
  const [ledger, setLedger] = useState(ledgerAccounts);
  const [journals, setJournals] = useState(journalEntries);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [moneyId, setMoneyId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const live = isSupabaseConfigured();

  async function refresh() {
    const data = await loadLiveAccounting();
    setAccounts(data.moneyAccounts); setLedger(data.ledgerAccounts); setTransactions(data.transactions); setJournals(data.journals);
    setMoneyId((current) => current || data.moneyAccounts[0]?.id || "");
    setCategoryId((current) => current || data.ledgerAccounts.find((account) => account.type === type)?.id || "");
  }
  useEffect(() => { if (!live) return; loadLiveAccounting().then((data) => { setAccounts(data.moneyAccounts); setLedger(data.ledgerAccounts); setTransactions(data.transactions); setJournals(data.journals); setMoneyId(data.moneyAccounts[0]?.id || ""); setCategoryId(data.ledgerAccounts.find((account) => account.type === "expense")?.id || ""); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Accounting data could not be loaded.")); }, [live]);

  const pnl = profitAndLoss(ledger, journals);
  const trial = trialBalance(ledger, journals);
  const cashBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const categories = ledger.filter((account) => account.type === (type === "income" ? "income" : "expense"));

  async function addTransaction() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || description.trim().length < 2) return;
    setSaving(true); setError("");
    try {
      if (live) {
        if (!moneyId || !categoryId) throw new Error("Select a money account and category.");
        await recordLiveTransaction({ type, amount: value, description, moneyAccountId: moneyId, categoryAccountId: categoryId });
        await refresh();
      } else {
        const item: BasicTransaction = { id: `tx-${Date.now()}`, date: "Today", type, category: type === "income" ? "Other income" : "Office expense", account: "Office Cash", description, amount: value };
        setTransactions((current) => [item, ...current]);
      }
      setOpen(false); setAmount(""); setDescription("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Transaction could not be saved."); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-1 text-xs font-semibold text-[#7a8495]">Financial control · {live ? "Live workspace" : "Preview data"}</p><h1 className="heading text-2xl font-extrabold text-[#17263f] sm:text-[30px]">Accounting</h1><p className="mt-1.5 text-sm text-[#7b8596]">Simple daily bookkeeping backed by a complete accounting ledger.</p></div><div className="flex flex-wrap gap-2"><div className="inline-flex rounded-xl border border-[#dfe3e9] bg-white p-1">{(["basic", "full"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={cn("rounded-lg px-4 py-2 text-[10px] font-extrabold capitalize", mode === item ? "bg-[#17263f] text-white" : "text-[#6f7b8e]")}>{item} mode</button>)}</div><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Plus size={15}/> Record transaction</button></div></header>
    {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={WalletCards} label="Cash & bank" value={formatMoney(cashBalance)} note={`Across ${accounts.length} manual accounts`} tone="blue"/><Metric icon={ArrowDownLeft} label="Income" value={formatMoney(pnl.income)} note="Posted revenue this period" tone="green"/><Metric icon={ArrowUpRight} label="Expenses" value={formatMoney(pnl.expenses)} note="Posted operating costs" tone="amber"/><Metric icon={CircleDollarSign} label="Net profit" value={formatMoney(pnl.profit)} note="Income less expenses" tone="violet"/></section>
    {mode === "basic" ? <div className="mt-6 grid gap-5 xl:grid-cols-[.8fr_1.5fr]"><section className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><h2 className="text-sm font-extrabold text-[#2d3b51]">Money accounts</h2><div className="mt-4 space-y-3">{accounts.map((account) => <div key={account.id} className="flex items-center gap-3 rounded-xl border border-[#e8ebef] p-3"><span className="grid size-10 place-items-center rounded-xl bg-[#eef2ff] text-[#4562b2]">{account.kind === "cash" ? <Banknote size={17}/> : account.kind === "bank" ? <Landmark size={17}/> : <Building2 size={17}/>}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#405069]">{account.name}</p><p className="mt-1 text-[9px] capitalize text-[#929ba8]">{account.kind.replace("_", " ")}</p></div><p className="text-xs font-extrabold text-[#2e3d54]">{formatMoney(account.balance)}</p></div>)}</div></section><TransactionList transactions={transactions}/></div>
      : <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="card-shadow overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"><div className="flex items-center justify-between border-b border-[#eceef2] px-5 py-4"><div><h2 className="text-sm font-extrabold text-[#2d3b51]">Trial balance</h2><p className="mt-1 text-[10px] text-[#929ba8]">Posted double-entry balances</p></div><Scale size={18} className="text-[#6f7c90]"/></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[11px]"><thead className="bg-[#fafbfc] text-[9px] uppercase tracking-wide text-[#929aa7]"><tr><th className="px-5 py-3">Account</th><th className="px-4 py-3 text-right">Debit</th><th className="px-4 py-3 text-right">Credit</th><th className="px-5 py-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-[#eff1f4]">{trial.filter((row) => row.debit || row.credit).map((row) => <tr key={row.account.id}><td className="px-5 py-3 font-bold text-[#435169]">{row.account.code} · {row.account.name}</td><td className="px-4 py-3 text-right">{formatMoney(row.debit)}</td><td className="px-4 py-3 text-right">{formatMoney(row.credit)}</td><td className="px-5 py-3 text-right font-extrabold">{formatMoney(row.balance)}</td></tr>)}</tbody></table></div></section><section className="card-shadow rounded-2xl border border-[#e4e7ec] bg-white p-5"><div className="flex items-center gap-2"><BookOpenCheck size={17}/><h2 className="text-sm font-extrabold">Journal entries</h2></div><div className="mt-4 space-y-3">{journals.map((entry) => <div key={entry.id} className="rounded-xl border border-[#e8ebef] p-3"><div className="flex justify-between"><p className="text-[10px] font-extrabold">{entry.number}</p><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700">{entry.status}</span></div><p className="mt-2 text-[10px] text-[#7d8898]">{entry.memo}</p></div>)}</div></section></div>}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111c2d]/55 p-4" role="dialog" aria-modal="true" aria-label="Record transaction"><div className="w-full max-w-md rounded-2xl bg-white p-6"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8b94a2]">Basic accounting</p><h2 className="mt-1 text-lg font-extrabold">New transaction</h2></div><button aria-label="Close transaction" onClick={() => setOpen(false)}><X size={18}/></button></div><div className="mt-5 grid grid-cols-2 gap-2">{(["income", "expense"] as const).map((item) => <button key={item} onClick={() => { setType(item); setCategoryId(ledger.find((account) => account.type === item)?.id || ""); }} className={cn("rounded-xl border py-3 text-xs font-extrabold capitalize", type === item ? "border-[#8da7f8] bg-[#edf2ff] text-[#3157be]" : "border-[#dfe3e9]")}>{item}</button>)}</div>{live && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Money account<select aria-label="Money account" value={moneyId} onChange={(event) => setMoneyId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="text-xs font-bold">Category<select aria-label="Transaction category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border px-3">{categories.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div>}<label className="mt-4 block text-xs font-bold">Amount<input aria-label="Transaction amount" type="number" className="mt-2 h-11 w-full rounded-xl border px-3" value={amount} onChange={(event) => setAmount(event.target.value)}/></label><label className="mt-4 block text-xs font-bold">Description<input aria-label="Transaction description" className="mt-2 h-11 w-full rounded-xl border px-3" value={description} onChange={(event) => setDescription(event.target.value)}/></label><button disabled={saving} onClick={addTransaction} className="mt-6 w-full rounded-xl bg-[#246bfd] py-3 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Posting…" : "Post transaction"}</button></div></div>}
  </div>;
}

function TransactionList({ transactions }: { transactions: BasicTransaction[] }) { return <section className="card-shadow overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white"><div className="border-b px-5 py-4"><h2 className="text-sm font-extrabold">Income & expenses</h2></div><div className="divide-y">{transactions.length ? transactions.map((transaction) => <div key={transaction.id} className="flex items-center gap-3 px-5 py-4"><span className={cn("grid size-9 place-items-center rounded-xl", transaction.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{transaction.type === "income" ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}</span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-extrabold">{transaction.description}</p><p className="mt-1 text-[9px] text-[#929ba8]">{transaction.date} · {transaction.account} · {transaction.category}</p></div><p className={cn("text-xs font-extrabold", transaction.type === "income" ? "text-emerald-700" : "text-amber-700")}>{transaction.type === "income" ? "+" : "−"}{formatMoney(transaction.amount)}</p></div>) : <p className="p-8 text-center text-xs text-[#8a94a4]">No transactions yet.</p>}</div></section>; }
function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof WalletCards; label: string; value: string; note: string; tone: "blue" | "green" | "amber" | "violet" }) { const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" }; return <article className="card-shadow rounded-2xl border bg-white p-5"><span className={cn("grid size-10 place-items-center rounded-xl", colors[tone])}><Icon size={18}/></span><p className="mt-4 text-xs font-semibold text-[#7d8797]">{label}</p><p className="heading mt-1.5 text-[22px] font-extrabold">{value}</p><p className="mt-2 text-[10px] text-[#969eaa]">{note}</p></article>; }
