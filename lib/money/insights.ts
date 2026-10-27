import {signedAmount} from "./rules";
import type {TrackerAccount,TrackerCategory,TrackerTransaction} from "./types";

export type MoneyRange="7d"|"30d"|"12w"|"6m"|"1y"|"all";

export interface CashFlowPoint{
  key:string;
  label:string;
  income:number;
  expense:number;
  cashFlow:number;
  balance:number;
}

export interface CategoryTotal{
  id:string;
  name:string;
  color:string;
  total:number;
  percent:number;
}

const day=86_400_000;

function startOfDay(date:Date){const copy=new Date(date);copy.setHours(0,0,0,0);return copy;}
function addDays(date:Date,amount:number){const copy=new Date(date);copy.setDate(copy.getDate()+amount);return copy;}
function startOfMonth(date:Date){return new Date(date.getFullYear(),date.getMonth(),1);}
function addMonths(date:Date,amount:number){return new Date(date.getFullYear(),date.getMonth()+amount,1);}

export function rangeStart(range:MoneyRange,now=new Date()){
  const end=startOfDay(now);
  if(range==="7d")return addDays(end,-6);
  if(range==="30d")return addDays(end,-29);
  if(range==="12w")return addDays(end,-83);
  if(range==="6m")return addMonths(startOfMonth(end),-5);
  if(range==="1y")return addMonths(startOfMonth(end),-11);
  return undefined;
}

export function transactionsInRange(rows:TrackerTransaction[],range:MoneyRange,now=new Date()){
  const start=rangeStart(range,now);
  if(!start)return rows;
  const end=addDays(startOfDay(now),1).getTime();
  return rows.filter(row=>{const value=new Date(row.occurredAt).getTime();return value>=start.getTime()&&value<end;});
}

function shortDate(date:Date){return date.toLocaleDateString("en-BD",{month:"short",day:"numeric"});}
function monthLabel(date:Date){return date.toLocaleDateString("en-BD",{month:"short"});}

export function buildCashFlowSeries(rows:TrackerTransaction[],accounts:TrackerAccount[],range:MoneyRange,now=new Date()):CashFlowPoint[]{
  const start=rangeStart(range,now)??startOfMonth(new Date(Math.min(...rows.map(row=>new Date(row.occurredAt).getTime()),now.getTime())));
  const monthly=range==="6m"||range==="1y"||range==="all";
  const weekly=range==="12w";
  const bucketCount=monthly?(range==="6m"?6:range==="1y"?12:Math.max(1,(now.getFullYear()-start.getFullYear())*12+now.getMonth()-start.getMonth()+1)):weekly?12:range==="7d"?7:30;
  const opening=accounts.filter(account=>account.includeInTotal&&account.active).reduce((sum,account)=>sum+account.openingBalance,0);
  const beforeStart=rows.filter(row=>new Date(row.occurredAt)<start&&row.status==="cleared").reduce((sum,row)=>sum+signedAmount(row),0);
  let balance=opening+beforeStart;
  return Array.from({length:bucketCount},(_,index)=>{
    const from=monthly?addMonths(startOfMonth(start),index):weekly?addDays(start,index*7):addDays(start,index);
    const to=monthly?addMonths(from,1):addDays(from,weekly?7:1);
    const bucket=rows.filter(row=>{const value=new Date(row.occurredAt);return value>=from&&value<to;});
    const income=bucket.filter(row=>row.type==="income").reduce((sum,row)=>sum+row.amount,0);
    const expense=bucket.filter(row=>row.type==="expense").reduce((sum,row)=>sum+row.amount,0);
    balance+=bucket.filter(row=>row.status==="cleared").reduce((sum,row)=>sum+signedAmount(row),0);
    return{key:from.toISOString(),label:monthly?monthLabel(from):weekly?`W${index+1}`:shortDate(from),income,expense,cashFlow:income-expense,balance};
  });
}

export function categoryTotals(rows:TrackerTransaction[],categories:TrackerCategory[],type:"income"|"expense"="expense"):CategoryTotal[]{
  const mapped=categories.filter(category=>category.type===type&&category.active).map(category=>({id:category.id,name:category.name,color:category.color,total:rows.filter(row=>row.type===type&&row.categoryId===category.id).reduce((sum,row)=>sum+row.amount,0)})).filter(row=>row.total>0).sort((a,b)=>b.total-a.total);
  const total=mapped.reduce((sum,row)=>sum+row.total,0);
  return mapped.map(row=>({...row,percent:total?row.total/total*100:0}));
}

export function periodComparison(rows:TrackerTransaction[],range:MoneyRange,now=new Date()){
  const currentStart=rangeStart(range,now);
  if(!currentStart)return{current:rows,previous:[] as TrackerTransaction[]};
  const currentEnd=addDays(startOfDay(now),1);
  const span=currentEnd.getTime()-currentStart.getTime();
  const previousStart=new Date(currentStart.getTime()-span);
  const previous=rows.filter(row=>{const value=new Date(row.occurredAt).getTime();return value>=previousStart.getTime()&&value<currentStart.getTime();});
  return{current:rows.filter(row=>{const value=new Date(row.occurredAt).getTime();return value>=currentStart.getTime()&&value<currentEnd.getTime();}),previous};
}

export function percentageChange(current:number,previous:number){
  if(previous===0)return current===0?0:null;
  return(current-previous)/Math.abs(previous)*100;
}

export function daysBetween(a:Date,b:Date){return Math.round((startOfDay(b).getTime()-startOfDay(a).getTime())/day);}
