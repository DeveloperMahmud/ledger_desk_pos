import {AppShell} from "@/components/app-shell";
import {MoneyDashboard} from "@/components/money/money-dashboard";

export default async function TransactionsPage({searchParams}:{searchParams:Promise<{category?:string}>}){
  const params=await searchParams;
  return <AppShell><MoneyDashboard section="transactions" initialCategory={params.category||""}/></AppShell>;
}
