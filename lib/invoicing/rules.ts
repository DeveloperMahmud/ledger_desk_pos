import type { Invoice, InvoiceLine } from "./types";

export interface InvoiceTotals {
  subtotal: number;
  lineDiscount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
}

export function lineNet(line: InvoiceLine) {
  if (line.quantity <= 0 || line.unitPrice < 0 || line.discount < 0 || line.taxRate < 0) throw new Error("Invalid invoice line values.");
  return Math.max(line.quantity * line.unitPrice - line.discount, 0);
}

export function invoiceTotals(invoice: Pick<Invoice, "lines" | "payments">): InvoiceTotals {
  const subtotal = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const lineDiscount = invoice.lines.reduce((sum, line) => sum + line.discount, 0);
  const tax = invoice.lines.reduce((sum, line) => sum + lineNet(line) * (line.taxRate / 100), 0);
  const total = Math.max(subtotal - lineDiscount + tax, 0);
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { subtotal, lineDiscount, tax, total, paid, due: Math.max(total - paid, 0) };
}

export function invoicePaymentStatus(invoice: Pick<Invoice, "lines" | "payments">) {
  const { total, paid } = invoiceTotals(invoice);
  if (total > 0 && paid >= total) return "paid" as const;
  if (paid > 0) return "partially_paid" as const;
  return "issued" as const;
}

export function productStockRequirements(lines: InvoiceLine[]) {
  return lines.filter((line) => line.kind === "product" && line.catalogItemId).map((line) => ({ catalogItemId: line.catalogItemId as string, quantity: line.quantity }));
}

export function canAccessPublicInvoice(invoice: Invoice, now = new Date()) {
  if (!invoice.publicLink || invoice.publicLink.revoked) return false;
  return new Date(invoice.publicLink.expiresAt).getTime() >= now.getTime();
}
