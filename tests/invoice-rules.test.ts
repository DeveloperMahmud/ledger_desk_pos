import { describe, expect, it } from "vitest";
import { canAccessPublicInvoice, invoicePaymentStatus, invoiceTotals, productStockRequirements } from "@/lib/invoicing/rules";
import { invoices } from "@/lib/invoicing/demo-data";

describe("invoice rules", () => {
  const invoice = invoices[0];
  it("calculates mixed invoice totals and due balance", () => {
    expect(invoiceTotals(invoice)).toEqual({ subtotal: 65490, lineDiscount: 5000, tax: 0, total: 60490, paid: 30000, due: 30490 });
  });
  it("derives partial payment status", () => expect(invoicePaymentStatus(invoice)).toBe("partially_paid"));
  it("returns only product stock requirements", () => expect(productStockRequirements(invoice.lines)).toEqual([{ catalogItemId: "premium-paper", quantity: 14 }]));
  it("honors public link expiry and revocation", () => {
    expect(canAccessPublicInvoice(invoice, new Date("2026-10-24"))).toBe(true);
    expect(canAccessPublicInvoice({ ...invoice, publicLink: { ...invoice.publicLink!, revoked: true } }, new Date("2026-10-24"))).toBe(false);
  });
});
