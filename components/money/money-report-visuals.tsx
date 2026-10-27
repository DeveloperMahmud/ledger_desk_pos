"use client";

import {useState} from "react";
import {BarChart3,ChartPie,LineChart,Table2,TrendingUp} from "lucide-react";
import type {CashFlowPoint,CategoryTotal,MoneyRange} from "@/lib/money/insights";
import type {MoneySnapshot} from "@/lib/money/types";
import {formatMoney} from "@/lib/inventory/rules";
import {BalanceTrend,CashFlowChart,ChartCard,ComparisonBadge,DonutChart,ForecastChart,RangePicker} from "./money-charts";
import {cn} from "@/lib/utils";

type View="overview"|"cashflow"|"spending"|"forecast"|"table";
const views:[View,string,typeof BarChart3][]=[["overview","Overview",BarChart3],["cashflow","Cash flow",LineChart],["spending","Spending",ChartPie],["forecast","Forecast",TrendingUp],["table","Table",Table2]];

interface Props{
  range:MoneyRange;
  setRange:(range:MoneyRange)=>void;
  points:CashFlowPoint[];
  categoryRows:CategoryTotal[];
  transactions:MoneySnapshot["transactions"];
  summary:{income:number;expense:number;cashFlow:number;balance:number};
  cashFlowChange:number|null;
  recurring:MoneySnapshot["recurring"];
  onCategory:(id:string)=>void;
  accountName:(id:string)=>string;
  categoryName:(id?:string)=>string;
}

export function MoneyReportVisuals({range,setRange,points,categoryRows,transactions,summary,cashFlowChange,recurring,onCategory,accountName,categoryName}:Props){
  const [view,setView]=useState<View>("overview");const plannedExpense=recurring.filter(item=>item.type==="expense").reduce((sum,item)=>sum+item.amount,0);const plannedIncome=recurring.filter(item=>item.type==="income").reduce((sum,item)=>sum+item.amount,0);
  return <div className="space-y-5"><div className="flex flex-col gap-4 rounded-2xl border border-[var(--money-border)] bg-[var(--money-surface)] p-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-1 overflow-x-auto">{views.map(([key,label,Icon])=><button key={key} type="button" onClick={()=>setView(key)} className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-extrabold",view===key?"bg-[#17263f] text-white":"text-[var(--money-muted)] hover:bg-[var(--money-surface-subtle)]")}><Icon size={14}/>{label}</button>)}</div><RangePicker value={range} onChange={setRange}/></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ReportMetric label="Net cash flow" value={formatMoney(summary.cashFlow)} footer={<ComparisonBadge value={cashFlowChange}/>}/><ReportMetric label="Income" value={formatMoney(summary.income)} tone="positive"/><ReportMetric label="Expenses" value={formatMoney(summary.expense)} tone="negative"/><ReportMetric label="Current balance" value={formatMoney(summary.balance)} tone="accent"/></section>
    {(view==="overview"||view==="cashflow")&&<section className="grid gap-5 xl:grid-cols-2"><ChartCard title="Cash-flow movement" question="How much came in and went out in each period?" eyebrow="Income vs expense"><CashFlowChart points={points}/></ChartCard><ChartCard title="Balance trend" question="How did the available balance change over time?" eyebrow="Running balance"><BalanceTrend points={points}/></ChartCard></section>}
    {(view==="overview"||view==="spending")&&<section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><ChartCard title="Spending by category" question="Where did the money go?" eyebrow="Distribution"><DonutChart rows={categoryRows} onSelect={onCategory}/></ChartCard><ChartCard title="Category ranking" question="Exact totals behind the chart." eyebrow="Top expenses"><div className="space-y-3">{categoryRows.map(row=><button key={row.id} onClick={()=>onCategory(row.id)} className="block w-full text-left"><div className="flex justify-between text-[11px] font-bold"><span>{row.name}</span><span>{formatMoney(row.total)} · {row.percent.toFixed(1)}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--money-track)]"><div className="h-full rounded-full" style={{width:`${row.percent}%`,background:row.color}}/></div></button>)}</div></ChartCard></section>}
    {view==="forecast"&&<ChartCard title="Balance forecast" question="Will current balances cover upcoming recurring plans?" eyebrow="Projection"><ForecastChart starting={summary.balance} plannedExpense={plannedExpense} plannedIncome={plannedIncome}/></ChartCard>}
    {view==="table"&&<ChartCard title="Exact-value report" question="Every record behind the selected period." eyebrow={`${transactions.length} records`}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="text-[9px] uppercase text-[var(--money-muted)]"><tr><th className="py-2">Date</th><th>Details</th><th>Account</th><th>Type</th><th className="text-right">Amount</th></tr></thead><tbody className="divide-y divide-[var(--money-border)]">{transactions.map(row=><tr key={row.id}><td className="py-3">{new Date(row.occurredAt).toLocaleDateString("en-BD")}</td><td><b>{row.payee||categoryName(row.categoryId)}</b><small className="block text-[9px] text-[var(--money-muted)]">{categoryName(row.categoryId)}</small></td><td>{accountName(row.accountId)}</td><td className="capitalize">{row.type}</td><td className={cn("text-right font-extrabold",row.type==="income"?"text-emerald-600":row.type==="expense"?"text-rose-600":"text-violet-600")}>{formatMoney(row.amount)}</td></tr>)}</tbody></table></div></ChartCard>}
  </div>;
}

function ReportMetric({label,value,tone="default",footer}:{label:string;value:string;tone?:"default"|"positive"|"negative"|"accent";footer?:React.ReactNode}){const colors={default:"",positive:"text-emerald-600",negative:"text-rose-600",accent:"text-[var(--money-accent)]"};return <article className="money-card p-5"><p className="text-[10px] font-bold text-[var(--money-muted)]">{label}</p><strong className={cn("mt-2 block text-xl",colors[tone])}>{value}</strong>{footer&&<div className="mt-3">{footer}</div>}</article>}
