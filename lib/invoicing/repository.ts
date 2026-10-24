import type { Invoice, InvoiceStatus, InvoiceTemplate, PaymentMethod } from "./types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentWorkspaceContext } from "@/lib/supabase/workspace-client";

type NamedRelation = { name?: string; email?: string; style_key?: string; symbol?: string; current_quantity?: number } | Array<{ name?: string; email?: string; style_key?: string; symbol?: string; current_quantity?: number }> | null;
const one = (relation: NamedRelation) => Array.isArray(relation) ? relation[0] : relation;
const displayDate = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const sqlDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid invoice date.");
  return date.toISOString().slice(0, 10);
};

interface InvoiceRow {
  id: string; invoice_number: string; client_id: string; project_id: string | null; status: InvoiceStatus; currency: string;
  issue_date: string | null; due_date: string | null; title: string; notes: string | null; terms: string | null;
  client: NamedRelation; template: NamedRelation;
  items: Array<{ id: string; catalog_item_id: string | null; kind: "product" | "service"; description: string; quantity: number | string; unit_price: number | string; discount: number | string; tax_rate: number | string; unit: string }>;
  payments: Array<{ id: string; amount: number | string; method: PaymentMethod; account_label: string; paid_at: string; reference: string | null; proof_path: string | null }>;
}

function mapInvoice(row: InvoiceRow): Invoice {
  const client = one(row.client);
  const template = one(row.template);
  return {
    id: row.id,
    number: row.invoice_number,
    clientId: row.client_id,
    clientName: client?.name || "Unknown client",
    clientEmail: client?.email || "",
    projectId: row.project_id || undefined,
    status: row.status,
    template: (template?.style_key || "modern") as InvoiceTemplate,
    currency: row.currency,
    issueDate: displayDate(row.issue_date),
    dueDate: displayDate(row.due_date),
    title: row.title,
    notes: row.notes || undefined,
    terms: row.terms || undefined,
    lines: (row.items || []).map((line) => ({ id: line.id, catalogItemId: line.catalog_item_id || undefined, kind: line.kind, description: line.description, quantity: Number(line.quantity), unitPrice: Number(line.unit_price), discount: Number(line.discount), taxRate: Number(line.tax_rate), unit: line.unit })),
    payments: (row.payments || []).map((payment) => ({ id: payment.id, amount: Number(payment.amount), method: payment.method, account: payment.account_label, paidAt: new Date(payment.paid_at).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }), reference: payment.reference || undefined, proofName: payment.proof_path?.split("/").at(-1) })),
  };
}

const invoiceSelect = "id,invoice_number,client_id,project_id,status,currency,issue_date,due_date,title,notes,terms,client:crm_clients(name,email),template:invoice_templates(style_key),items:invoice_items(id,catalog_item_id,kind,description,quantity,unit_price,discount,tax_rate,unit),payments:invoice_payments(id,amount,method,account_label,paid_at,reference,proof_path)";

export async function loadLiveInvoices() {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("invoices").select(invoiceSelect).eq("workspace_id", context.workspaceId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as InvoiceRow[]).map(mapInvoice);
}

export async function loadLiveInvoice(invoiceId: string) {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("invoices").select(invoiceSelect).eq("workspace_id", context.workspaceId).eq("id", invoiceId).single();
  if (error) throw error;
  return mapInvoice(data as unknown as InvoiceRow);
}

export interface InvoiceEditorClient { id: string; name: string; email: string; }
export interface InvoiceEditorProduct { id: string; name: string; sku: string; price: number; unit: string; stock: number; }

export async function loadInvoiceEditorOptions() {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const [clientsResult, productsResult] = await Promise.all([
    supabase.from("crm_clients").select("id,name,email").eq("workspace_id", context.workspaceId).eq("status", "active").order("name"),
    supabase.from("catalog_items").select("id,name,sku,selling_price,unit:units(symbol),stock:stock_balances(current_quantity)").eq("workspace_id", context.workspaceId).eq("kind", "product").eq("is_active", true).order("name"),
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (productsResult.error) throw productsResult.error;
  const clients: InvoiceEditorClient[] = (clientsResult.data || []).map((client) => ({ id: client.id, name: client.name, email: client.email || "" }));
  const products: InvoiceEditorProduct[] = (productsResult.data || []).map((product) => ({
    id: product.id, name: product.name, sku: product.sku, price: Number(product.selling_price),
    unit: one(product.unit as NamedRelation)?.symbol || "unit",
    stock: Number(one(product.stock as NamedRelation)?.current_quantity || 0),
  }));
  return { clients, products };
}

export async function saveLiveInvoiceDraft(invoice: Invoice, existingId?: string) {
  const context = await getCurrentWorkspaceContext();
  const supabase = createSupabaseBrowserClient();
  const payload = {
    target_client_id: invoice.clientId,
    template_style: invoice.template,
    invoice_title: invoice.title,
    invoice_currency: invoice.currency,
    invoice_issue_date: sqlDate(invoice.issueDate),
    invoice_due_date: sqlDate(invoice.dueDate),
    invoice_notes: invoice.notes || null,
    invoice_terms: invoice.terms || null,
    invoice_lines: invoice.lines.map((line) => ({ catalogItemId: line.catalogItemId || null, kind: line.kind, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, discount: line.discount, taxRate: line.taxRate, unit: line.unit })),
  };
  const result = existingId
    ? await supabase.rpc("update_invoice_draft", { target_invoice_id: existingId, ...payload })
    : await supabase.rpc("create_invoice_draft", { target_workspace_id: context.workspaceId, target_project_id: invoice.projectId || null, ...payload });
  const { data, error } = result;
  if (error) throw error;
  return data as string;
}

export async function issueLiveInvoice(invoiceId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("issue_invoice", { target_invoice_id: invoiceId });
  if (error) throw error;
}

export async function recordLiveInvoicePayment(invoiceId: string, amount: number, method: PaymentMethod, account: string, reference?: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("record_invoice_payment", { target_invoice_id: invoiceId, payment_amount: amount, payment_method_value: method, payment_account: account, payment_reference: reference || null, payment_proof_path: null });
  if (error) throw error;
  return data as string;
}

export async function createLiveInvoiceLink(invoiceId: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_invoice_public_link", { target_invoice_id: invoiceId, valid_for_days: 30 });
  if (error) throw error;
  return data as string;
}

export async function queueLiveInvoiceEmail(invoiceId: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("queue_invoice_email", { target_invoice_id: invoiceId, target_template_key: "invoice_send" });
  if (error) throw error;
}
