import { notFound } from "next/navigation";
import { InvoiceViewer } from "@/components/invoices/invoice-viewer";
import { findInvoice, invoices } from "@/lib/invoicing/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function generateStaticParams(){return invoices.map(invoice=>({id:invoice.id}));}
export default async function InvoicePage({params}:{params:Promise<{id:string}>}){const {id}=await params;const invoice=findInvoice(id);if(!invoice&&!isSupabaseConfigured())notFound();return <InvoiceViewer initialInvoice={invoice} invoiceId={id}/>;}
