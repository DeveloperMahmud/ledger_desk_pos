import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentWorkspaceContext } from "@/lib/supabase/workspace-client";

export interface ReportSnapshot { revenue:number; expenses:number; outstanding:number; inventoryValue:number; activeProjects:number; activeClients:number; lowStock:number; overdue:number; months:{name:string;income:number;expense:number}[] }

export async function loadLiveReport():Promise<ReportSnapshot>{
  const context=await getCurrentWorkspaceContext(); const supabase=createSupabaseBrowserClient();
  const since=new Date(); since.setMonth(since.getMonth()-5); since.setDate(1); const sinceDate=since.toISOString().slice(0,10);
  const [invoices,items,projects,clients,transactions]=await Promise.all([
    supabase.from("invoices").select("status,grand_total,paid_total,due_date").eq("workspace_id",context.workspaceId),
    supabase.from("catalog_items").select("purchase_cost,low_stock_at,balances:stock_balances(current_quantity)").eq("workspace_id",context.workspaceId).eq("is_active",true),
    supabase.from("projects").select("status").eq("workspace_id",context.workspaceId),
    supabase.from("crm_clients").select("status").eq("workspace_id",context.workspaceId),
    supabase.from("financial_transactions").select("transaction_type,transaction_date,amount").eq("workspace_id",context.workspaceId).gte("transaction_date",sinceDate),
  ]);
  for(const result of [invoices,items,projects,clients,transactions]) if(result.error) throw result.error;
  const invoiceRows=invoices.data??[]; const now=new Date().toISOString().slice(0,10);
  const revenue=invoiceRows.filter(row=>row.status!=="draft"&&row.status!=="cancelled").reduce((sum,row)=>sum+Number(row.paid_total),0);
  const outstanding=invoiceRows.reduce((sum,row)=>sum+Math.max(0,Number(row.grand_total)-Number(row.paid_total)),0);
  let inventoryValue=0,lowStock=0;
  for(const row of items.data??[]){const quantity=(row.balances??[]).reduce((sum,item)=>sum+Number(item.current_quantity),0);inventoryValue+=quantity*Number(row.purchase_cost);if(quantity<=Number(row.low_stock_at))lowStock++;}
  const months=Array.from({length:6},(_,index)=>{const date=new Date();date.setDate(1);date.setMonth(date.getMonth()-(5-index));return{key:date.toISOString().slice(0,7),name:date.toLocaleDateString("en-US",{month:"short"}),income:0,expense:0};});
  for(const row of transactions.data??[]){const bucket=months.find(month=>month.key===row.transaction_date.slice(0,7));if(bucket&&row.transaction_type!=="transfer")bucket[row.transaction_type as "income"|"expense"]+=Number(row.amount);}
  return {revenue,expenses:(transactions.data??[]).filter(row=>row.transaction_type==="expense").reduce((sum,row)=>sum+Number(row.amount),0),outstanding,inventoryValue,activeProjects:(projects.data??[]).filter(row=>!["completed","cancelled"].includes(row.status)).length,activeClients:(clients.data??[]).filter(row=>row.status==="active").length,lowStock,overdue:invoiceRows.filter(row=>row.due_date<now&&Number(row.grand_total)>Number(row.paid_total)).length,months:months.map(({name,income,expense})=>({name,income,expense}))};
}
