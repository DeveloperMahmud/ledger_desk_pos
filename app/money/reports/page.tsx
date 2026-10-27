import {AppShell} from "@/components/app-shell";
import {MoneyDashboard} from "@/components/money/money-dashboard";
import type {MoneyRange} from "@/lib/money/insights";

const ranges:MoneyRange[]=["7d","30d","12w","6m","1y","all"];

export default async function ReportsPage({searchParams}:{searchParams:Promise<{range?:string}>}){
  const params=await searchParams;
  const initialRange=ranges.includes(params.range as MoneyRange)?params.range as MoneyRange:"30d";
  return <AppShell><MoneyDashboard section="reports" initialRange={initialRange}/></AppShell>;
}
