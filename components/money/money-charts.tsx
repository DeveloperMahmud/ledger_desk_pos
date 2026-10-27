"use client";

import {ArrowDownRight,ArrowUpRight,BarChart3,ChevronRight,Info,TrendingUp} from "lucide-react";
import type {CashFlowPoint,CategoryTotal,MoneyRange} from "@/lib/money/insights";
import {formatMoney} from "@/lib/inventory/rules";
import {categoryIcon} from "./money-icons";
import {cn} from "@/lib/utils";

export const moneyRanges:{value:MoneyRange;label:string}[]=[{value:"7d",label:"7D"},{value:"30d",label:"30D"},{value:"12w",label:"12W"},{value:"6m",label:"6M"},{value:"1y",label:"1Y"},{value:"all",label:"All"}];

export function RangePicker({value,onChange,compact=false}:{value:MoneyRange;onChange:(value:MoneyRange)=>void;compact?:boolean}){
  return <div className={cn("money-segmented overflow-x-auto",compact&&"money-segmented-compact")} aria-label="Report period">{moneyRanges.map(item=><button key={item.value} type="button" aria-pressed={value===item.value} onClick={()=>onChange(item.value)}>{item.label}</button>)}</div>;
}

export function ChartCard({title,question,eyebrow,action,children,className}:{title:string;question:string;eyebrow?:string;action?:React.ReactNode;children:React.ReactNode;className?:string}){
  return <article className={cn("money-card",className)}><header className="money-card-header"><div>{eyebrow&&<p className="money-eyebrow">{eyebrow}</p>}<h2>{title}</h2><p>{question}</p></div>{action}</header><div className="money-card-body">{children}</div></article>;
}

export function DonutChart({rows,totalLabel="Spent",onSelect}:{rows:CategoryTotal[];totalLabel?:string;onSelect?:(id:string)=>void}){
  const total=rows.reduce((sum,row)=>sum+row.total,0);const segments=rows.reduce<Array<{row:CategoryTotal;length:number;offset:number}>>((items,row)=>{const length=row.percent*2.827;const offset=items.reduce((sum,item)=>sum+item.length,0);return[...items,{row,length,offset}]},[]);
  return <div className="grid items-center gap-6 md:grid-cols-[210px_1fr]"><div className="relative mx-auto size-[190px]" role="img" aria-label={`${totalLabel}: ${formatMoney(total)} across ${rows.length} categories`}><svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="45" fill="none" stroke="var(--money-track)" strokeWidth="18"/>{segments.map(({row,length,offset})=><circle key={row.id} cx="60" cy="60" r="45" fill="none" stroke={row.color} strokeWidth="18" strokeDasharray={`${Math.max(length-1,0)} ${282.7-Math.max(length-1,0)}`} strokeDashoffset={-offset} className="cursor-pointer transition-[stroke-width] hover:[stroke-width:22]" onClick={()=>onSelect?.(row.id)}/>)}</svg><div className="absolute inset-0 grid place-content-center text-center"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--money-muted)]">{totalLabel}</span><strong className="mt-1 text-lg text-[var(--money-text)]">{formatMoney(total)}</strong></div></div><div className="space-y-2">{rows.slice(0,6).map(row=>{const Icon=categoryIcon(row.name);return <button key={row.id} type="button" onClick={()=>onSelect?.(row.id)} className="money-chart-row group"><span className="money-icon-chip" style={{color:row.color,background:`color-mix(in srgb, ${row.color} 13%, transparent)`}}><Icon size={15}/></span><span className="min-w-0 flex-1 text-left"><b className="block truncate">{row.name}</b><small>{row.percent.toFixed(1)}%</small></span><strong>{formatMoney(row.total)}</strong><ChevronRight size={14} className="text-[var(--money-muted)] transition group-hover:translate-x-0.5"/></button>})}{!rows.length&&<EmptyChart label="Add expense transactions to see category distribution."/>}</div></div>;
}

export function CashFlowChart({points}:{points:CashFlowPoint[]}){
  const visible=points.slice(-12);const max=Math.max(...visible.flatMap(point=>[point.income,point.expense]),1);const width=720,height=250,plotHeight=170,gap=width/Math.max(visible.length,1),bar=Math.min(16,gap*.25);
  return <div><div className="money-chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] min-w-[620px] w-full" role="img" aria-label="Income and expense cash flow chart">{[0,.25,.5,.75,1].map(step=><line key={step} x1="40" x2={width-10} y1={20+plotHeight*step} y2={20+plotHeight*step} stroke="var(--money-grid)" strokeDasharray="4 7"/>)}{visible.map((point,index)=>{const x=40+gap*index+gap/2;const incomeHeight=point.income/max*plotHeight;const expenseHeight=point.expense/max*plotHeight;return <g key={point.key}><rect x={x-bar-2} y={20+plotHeight-incomeHeight} width={bar} height={incomeHeight} rx="4" fill="var(--money-positive)"/><rect x={x+2} y={20+plotHeight-expenseHeight} width={bar} height={expenseHeight} rx="4" fill="var(--money-negative)"/><text x={x} y="218" textAnchor="middle" fill="var(--money-muted)" fontSize="10">{point.label}</text><title>{`${point.label}: income ${formatMoney(point.income)}, expense ${formatMoney(point.expense)}`}</title></g>})}</svg></div><ChartLegend items={[["var(--money-positive)","Income"],["var(--money-negative)","Expense"]]}/></div>;
}

export function BalanceTrend({points}:{points:CashFlowPoint[]}){
  const visible=points.slice(-12);const values=visible.map(point=>point.balance);const min=Math.min(...values,0),max=Math.max(...values,1),span=max-min||1;const width=720,height=220;const coords=visible.map((point,index)=>({x:30+(width-60)*(index/Math.max(visible.length-1,1)),y:20+(height-60)*(1-(point.balance-min)/span),...point}));const path=coords.map((point,index)=>`${index?"L":"M"}${point.x},${point.y}`).join(" ");const area=`${path} L${coords.at(-1)?.x??30},${height-40} L30,${height-40} Z`;
  return <div className="money-chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] min-w-[620px] w-full" role="img" aria-label="Balance trend chart"><defs><linearGradient id="balance-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--money-accent)" stopOpacity=".28"/><stop offset="1" stopColor="var(--money-accent)" stopOpacity="0"/></linearGradient></defs><line x1="30" x2={width-30} y1={height-40} y2={height-40} stroke="var(--money-grid)"/><path d={area} fill="url(#balance-area)"/><path d={path} fill="none" stroke="var(--money-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{coords.map((point,index)=><g key={point.key}><circle cx={point.x} cy={point.y} r="4" fill="var(--money-surface)" stroke="var(--money-accent)" strokeWidth="3"/><text x={point.x} y={height-18} textAnchor="middle" fill="var(--money-muted)" fontSize="10">{index%Math.max(1,Math.ceil(coords.length/6))===0?point.label:""}</text><title>{`${point.label}: ${formatMoney(point.balance)}`}</title></g>)}</svg></div>;
}

export function RadialGauge({value,label,detail,tone="positive"}:{value:number;label:string;detail:string;tone?:"positive"|"warning"|"negative"|"accent"}){
  const safe=Math.max(0,Math.min(100,value));const stroke={positive:"var(--money-positive)",warning:"var(--money-warning)",negative:"var(--money-negative)",accent:"var(--money-accent)"}[tone];
  return <div className="flex items-center gap-4"><div className="relative size-24 shrink-0"><svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r="39" fill="none" stroke="var(--money-track)" strokeWidth="12"/><circle cx="50" cy="50" r="39" fill="none" stroke={stroke} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${safe*2.45} 245`} /></svg><b className="absolute inset-0 grid place-items-center text-base">{Math.round(value)}%</b></div><div><p className="text-xs font-bold text-[var(--money-muted)]">{label}</p><strong className="mt-1 block text-lg">{detail}</strong></div></div>;
}

export function ComparisonBadge({value}:{value:number|null}){
  if(value===null)return <span className="money-compare neutral"><Info size={12}/> New in this period</span>;
  const positive=value>=0;return <span className={cn("money-compare",positive?"positive":"negative")}>{positive?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>} {Math.abs(value).toFixed(0)}% vs past period</span>;
}

export function ForecastChart({starting,plannedExpense,plannedIncome}:{starting:number;plannedExpense:number;plannedIncome:number}){
  const ending=starting-plannedExpense+plannedIncome;const values=[starting,plannedExpense,plannedIncome,ending];const max=Math.max(...values.map(Math.abs),1);const labels=["Starting","Planned out","Expected in","Ending"];const colors=["var(--money-accent)","var(--money-negative)","var(--money-positive)",ending>=0?"var(--money-forecast)":"var(--money-negative)"];
  return <div><div className="grid h-52 grid-cols-4 items-end gap-4 border-b border-[var(--money-border)] px-2 pt-4">{values.map((value,index)=><div key={labels[index]} className="flex h-full flex-col justify-end text-center"><span className="mb-2 text-[9px] font-bold text-[var(--money-muted)]">{formatMoney(value)}</span><div className="mx-auto w-full max-w-16 rounded-t-lg" style={{height:`${Math.max(4,Math.abs(value)/max*130)}px`,background:colors[index]}}/><small className="mt-2 text-[9px] font-bold">{labels[index]}</small></div>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-[var(--money-muted)]"><TrendingUp size={14}/> Projection uses current balances and active recurring plans; it is not a confirmed balance.</p></div>;
}

function ChartLegend({items}:{items:string[][]}){return <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-bold text-[var(--money-muted)]">{items.map(([color,label])=><span key={label} className="inline-flex items-center gap-2"><i className="size-2.5 rounded-sm" style={{background:color}}/>{label}</span>)}</div>}
function EmptyChart({label}:{label:string}){return <div className="grid min-h-32 place-content-center rounded-2xl border border-dashed border-[var(--money-border)] p-5 text-center"><BarChart3 className="mx-auto text-[var(--money-muted)]" size={24}/><p className="mt-2 text-xs text-[var(--money-muted)]">{label}</p></div>}
