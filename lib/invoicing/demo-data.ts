import type { Invoice } from "./types";

export const invoices: Invoice[] = [
  {
    id: "inv-2026-018", number: "INV-2026-018", clientId: "client-bright", clientName: "Bright Dental", clientEmail: "accounts@bright.example", projectId: "bright-portal", status: "partially_paid", template: "modern", currency: "BDT", issueDate: "23 Oct 2026", dueDate: "06 Nov 2026", title: "Website design & print materials", notes: "Thank you for choosing Northstar Studio.", terms: "Payment due within 14 days.",
    lines: [
      { id: "il1", kind: "service", description: "Website design milestone", quantity: 1, unitPrice: 65000, discount: 5000, taxRate: 0, unit: "Project" },
      { id: "il2", catalogItemId: "premium-paper", kind: "product", description: "Premium Matte Paper", quantity: 14, unitPrice: 35, discount: 0, taxRate: 0, unit: "Sheet" },
    ],
    payments: [{ id: "pay1", amount: 30000, method: "bank", account: "City Bank Business", paidAt: "24 Oct 2026", reference: "TRX-84729", proofName: "bank-slip.pdf" }],
    publicLink: { token: "demo-invoice-018", expiresAt: "2027-01-31T23:59:59Z", revoked: false, views: 3 },
  },
  { id: "inv-2026-017", number: "INV-2026-017", clientId: "client-kite", clientName: "Kite Logistics", clientEmail: "finance@kite.example", status: "paid", template: "classic", currency: "BDT", issueDate: "15 Oct 2026", dueDate: "22 Oct 2026", title: "Operations dashboard final payment", lines: [{ id: "il3", kind: "service", description: "Dashboard implementation", quantity: 1, unitPrice: 48000, discount: 0, taxRate: 0, unit: "Project" }], payments: [{ id: "pay2", amount: 48000, method: "bank", account: "City Bank Business", paidAt: "20 Oct 2026", reference: "TRX-83211" }] },
  { id: "inv-2026-016", number: "INV-2026-016", clientId: "client-mango", clientName: "Mango Home", clientEmail: "hello@mango.example", status: "overdue", template: "minimal", currency: "BDT", issueDate: "02 Oct 2026", dueDate: "16 Oct 2026", title: "Catalog design advance", lines: [{ id: "il4", kind: "service", description: "Catalog design advance", quantity: 1, unitPrice: 18000, discount: 0, taxRate: 0, unit: "Project" }], payments: [] },
  { id: "inv-2026-019", number: "INV-2026-019", clientId: "client-bright", clientName: "Bright Dental", clientEmail: "accounts@bright.example", status: "draft", template: "modern", currency: "BDT", issueDate: "24 Oct 2026", dueDate: "07 Nov 2026", title: "Monthly maintenance", lines: [{ id: "il5", kind: "service", description: "Website care plan", quantity: 1, unitPrice: 12000, discount: 0, taxRate: 0, unit: "Month" }], payments: [] },
];

export function findInvoice(id: string) { return invoices.find((invoice) => invoice.id === id); }
export function findPublicInvoice(token: string) { return invoices.find((invoice) => invoice.publicLink?.token === token); }
