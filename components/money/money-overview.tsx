"use client";

import Link from "next/link";
import {ArrowDownLeft,ArrowRightLeft,ArrowUpRight,ChevronRight,HandCoins,Plus,ReceiptText,RefreshCcw,WalletCards} from "lucide-react";
import type {CategoryTotal,CashFlowPoint,MoneyRange} from "@/lib/money/insights";
import type {MoneySnapshot,TrackerEntryType} from "@/lib/money/types";
import {formatMoney} from "@/lib/inventory/rules";
import {accountIcon,categoryIcon} from "./money-icons";
import {CashFlowChart,ChartCard,DonutChart,RadialGauge,RangePicker} from "./money-charts";
import {cn} from "@/lib/utils";

interface Props{
  summary:{income:number;expense:number;cashFlow:number;balance:number};
  accounts:MoneySnapshot["accounts"];
  transactions:MoneySnapshot["transactions"];
  categoryRows:CategoryTotal[];
  points:CashFlowPoint[];
  range:MoneyRange;
  setRange:(range:MoneyRange)=>void;
  accountName:(id:string)=>string;
  categoryName:(id?:string)=>string;
  onAdd:(type:TrackerEntryType)=>void;
  onCategory:(id:string)=>void;
}

export function MoneyOverview({summary,accounts,transactions,categoryRows,points,range,setRange,accountName,categoryName,onAdd,onCategory}:Props){
  const savingsRate=summary.income>0?summary.cashFlow/summary.income*100:0;
  return <div className="mt-5 space-y-5">
    <section className="money-page-shell grid gap-5 border border-[var(--money-border)] p-4 lg:grid-cols-[1.35fr_.65fr] lg:p-6">
      <div className="overflow-hidden rounded-3xl bg-[#12213a] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-200">Financial pulse</p><h2 className="mt-2 text-2xl font-extrabold">{summary.cashFlow>=0?"Your cash flow is healthy":"Expenses need attention"}</h2><p className="mt-2 max-w-xl text-xs leading-5 text-slate-300">Balance, income and spending from the selected period—kept separate from formal accounting.</p></div><RangePicker value={range} onChange={setRange} compact/></div>
        <div className="mt-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Available balance</p><p className="mt-2 text-4xl font-black tracking-tight">{formatMoney(summary.balance)}</p><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs"><span><b className="text-emerald-400">+{formatMoney(summary.income)}</b><small className="ml-2 text-slate-400">income</small></span><span><b className="text-rose-400">-{formatMoney(summary.expense)}</b><small className="ml-2 text-slate-400">expense</small></span></div></div><div className="rounded-2xl bg-white/[.07] p-4"><RadialGauge value={Math.max(0,savingsRate)} label="Saved from income" detail={`${Math.round(savingsRate)}%`} tone={savingsRate>=20?"positive":savingsRate>=0?"warning":"negative"}/></div></div>
      </div>
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        <QuickAction type="income" onClick={()=>onAdd("income")}/><QuickAction type="expense" onClick={()=>onAdd("expense")}/><QuickAction type="transfer" onClick={()=>onAdd("transfer")}/>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={WalletCards} label="Total balance" value={formatMoney(summary.balance)} tone="blue" hint="Across active accounts"/><Metric icon={ArrowDownLeft} label="Income" value={formatMoney(summary.income)} tone="green" hint="Selected period"/><Metric icon={ArrowUpRight} label="Expense" value={formatMoney(summary.expense)} tone="red" hint="Transfers excluded"/><Metric icon={ArrowRightLeft} label="Net cash flow" value={formatMoney(summary.cashFlow)} tone="violet" hint={summary.cashFlow>=0?"You kept money":"Spending exceeded income"}/></section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><ChartCard title="Income & expense trend" question="When did money come in and go out?" eyebrow="Cash flow" action={<Link href="/money/reports" className="text-[10px] font-extrabold text-[var(--money-accent)]">Full report</Link>}><CashFlowChart points={points}/></ChartCard><ChartCard title="Spending structure" question="Which categories used the most money?" eyebrow="Categories"><DonutChart rows={categoryRows} onSelect={onCategory}/></ChartCard></section>

    <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><ChartCard title="Accounts" question="Where is your money now?" eyebrow="Balances" action={<Link href="/money/accounts" className="text-[10px] font-extrabold text-[var(--money-accent)]">Manage</Link>}><div className="grid gap-2 sm:grid-cols-2">{accounts.filter(item=>item.active).map(account=>{const Icon=accountIcon(account.type);return <Link key={account.id} href="/money/accounts" className="money-chart-row"><span className="money-icon-chip" style={{color:account.color,background:`color-mix(in srgb, ${account.color} 13%, transparent)`}}><Icon size={16}/></span><span className="min-w-0 flex-1"><b className="block truncate">{account.name}</b><small className="capitalize">{account.type.replaceAll("_"," ")}</small></span><strong>{formatMoney(account.balance)}</strong></Link>})}</div></ChartCard><ChartCard title="Recent records" question="Your latest money activity at a glance." eyebrow="Transactions" action={<Link href="/money/transactions" className="text-[10px] font-extrabold text-[var(--money-accent)]">View all</Link>}><div className="divide-y divide-[var(--money-border)]">{transactions.slice(0,6).map(row=>{const Icon=categoryIcon(categoryName(row.categoryId));const positive=row.type==="income"||row.transferDirection==="in";return <div key={row.id} className="flex items-center gap-3 py-3"><span className="money-icon-chip" style={{color:positive?"var(--money-positive)":row.type==="transfer"?"var(--money-forecast)":"var(--money-negative)"}}><Icon size={16}/></span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{row.payee||categoryName(row.categoryId)}</b><small className="text-[10px] text-[var(--money-muted)]">{categoryName(row.categoryId)} · {accountName(row.accountId)} · {new Date(row.occurredAt).toLocaleDateString("en-BD")}</small></span><strong className={cn("text-xs",positive?"text-emerald-600":"text-rose-600")}>{positive?"+":"-"}{formatMoney(row.amount)}</strong></div>})}{!transactions.length&&<p className="py-10 text-center text-xs text-[var(--money-muted)]">No transactions yet. Use Quick Add to record one.</p>}</div></ChartCard></section>
  </div>;
}

function QuickAction({type,onClick}:{type:TrackerEntryType;onClick:()=>void}){const styles={income:"text-emerald-700 bg-emerald-50",expense:"text-rose-700 bg-rose-50",transfer:"text-violet-700 bg-violet-50"}[type];return <button type="button" onClick={onClick} className="group flex min-h-24 flex-col items-start justify-between rounded-2xl border border-[var(--money-border)] bg-[var(--money-surface)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:min-h-0 lg:flex-row lg:items-center"><span className={cn("grid size-10 place-items-center rounded-xl",styles)}>{type==="income"?<HandCoins size={18}/>:type==="expense"?<ReceiptText size={18}/>:<RefreshCcw size={18}/>}</span><span className="mt-2 lg:ml-3 lg:mt-0 lg:flex-1"><b className="block text-[11px] capitalize">{type}</b><small className="hidden text-[9px] text-[var(--money-muted)] lg:block">Record now</small></span><Plus size={14} className="hidden text-[var(--money-muted)] lg:block"/></button>}
function Metric({icon:Icon,label,value,tone,hint}:{icon:typeof WalletCards;label:string;value:string;tone:"blue"|"green"|"red"|"violet";hint:string}){const colors={blue:"bg-blue-50 text-blue-700",green:"bg-emerald-50 text-emerald-700",red:"bg-rose-50 text-rose-700",violet:"bg-violet-50 text-violet-700"};return <article className="money-card p-5"><div className="flex items-start justify-between"><span className={cn("grid size-10 place-items-center rounded-xl",colors[tone])}><Icon size={18}/></span><ChevronRight size={15} className="text-[var(--money-muted)]"/></div><p className="mt-4 text-[10px] font-bold text-[var(--money-muted)]">{label}</p><p className="mt-1 text-xl font-extrabold tracking-tight">{value}</p><p className="mt-1 text-[9px] text-[var(--money-muted)]">{hint}</p></article>}
