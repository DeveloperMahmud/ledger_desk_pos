import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Clock3, LockKeyhole } from "lucide-react";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { findPublicInvoice, invoices } from "@/lib/invoicing/demo-data";
import { mapPublicInvoice } from "@/lib/invoicing/public-invoice";
import { canAccessPublicInvoice } from "@/lib/invoicing/rules";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/supabase/config";

export function generateStaticParams() { return invoices.filter((invoice) => invoice.publicLink).map((invoice) => ({ token: invoice.publicLink!.token })); }

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invoice = findPublicInvoice(token);
  let live = false;

  if (isSupabaseConfigured() && supabaseConfig.url && supabaseConfig.anonKey) {
    const requestHeaders = await headers();
    const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc("get_public_invoice", { raw_token: token, request_user_agent: requestHeaders.get("user-agent"), request_ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null });
    if (error || !data) notFound();
    invoice = mapPublicInvoice(data);
    live = true;
  }

  if (!invoice || (!live && !canAccessPublicInvoice(invoice, new Date("2026-10-24")))) notFound();
  return <main id="main-content" className="min-h-screen bg-[#eaf0f7] px-4 py-6 sm:py-10"><div className="no-print mx-auto mb-5 flex max-w-[850px] flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-bold text-[#617086]"><LockKeyhole size={14} /> Secure client invoice</div><div className="flex gap-3 text-[10px] font-semibold text-[#7c8798]"><span className="inline-flex items-center gap-1"><Clock3 size={12} />{live ? "Protected expiring link" : "Preview link expires 31 Jan 2027"}</span></div></div><InvoiceDocument invoice={invoice} publicView /></main>;
}
