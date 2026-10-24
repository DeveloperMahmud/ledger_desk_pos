import type { Invoice, InvoiceTemplate, PaymentMethod } from "./types";

interface PublicPayload {
  invoice: { id: string; invoice_number: string; client_id: string; project_id?: string | null; status: Invoice["status"]; currency: string; issue_date?: string | null; due_date?: string | null; title: string; notes?: string | null; terms?: string | null };
  client: { name: string; email?: string | null };
  items: Array<{ id: string; catalog_item_id?: string | null; kind: "product" | "service"; description: string; quantity: number | string; unit_price: number | string; discount: number | string; tax_rate: number | string; unit: string }>;
  payments: Array<{ id: string; amount: number | string; method: PaymentMethod; account_label: string; paid_at: string; reference?: string | null }>;
  workspace?: { settings?: { invoice_template?: InvoiceTemplate } };
}

const dateLabel = (value?: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";

export function mapPublicInvoice(payload: PublicPayload): Invoice {
  const invoice = payload.invoice;
  return {
    id: invoice.id,
    number: invoice.invoice_number,
    clientId: invoice.client_id,
    clientName: payload.client.name,
    clientEmail: payload.client.email || "",
    projectId: invoice.project_id || undefined,
    status: invoice.status,
    template: payload.workspace?.settings?.invoice_template || "modern",
    currency: invoice.currency,
    issueDate: dateLabel(invoice.issue_date),
    dueDate: dateLabel(invoice.due_date),
    title: invoice.title,
    notes: invoice.notes || undefined,
    terms: invoice.terms || undefined,
    lines: payload.items.map((line) => ({ id: line.id, catalogItemId: line.catalog_item_id || undefined, kind: line.kind, description: line.description, quantity: Number(line.quantity), unitPrice: Number(line.unit_price), discount: Number(line.discount), taxRate: Number(line.tax_rate), unit: line.unit })),
    payments: payload.payments.map((payment) => ({ id: payment.id, amount: Number(payment.amount), method: payment.method, account: payment.account_label, paidAt: new Date(payment.paid_at).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }), reference: payment.reference || undefined })),
  };
}
