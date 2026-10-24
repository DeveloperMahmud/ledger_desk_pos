export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type InvoiceTemplate = "modern" | "classic" | "minimal";
export type InvoiceItemKind = "product" | "service";
export type PaymentMethod = "cash" | "bank" | "online_bank" | "mobile_banking" | "other";

export interface InvoiceLine {
  id: string;
  catalogItemId?: string;
  kind: InvoiceItemKind;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  unit: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  account: string;
  paidAt: string;
  reference?: string;
  proofName?: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  projectId?: string;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  currency: string;
  issueDate: string;
  dueDate: string;
  title: string;
  notes?: string;
  terms?: string;
  lines: InvoiceLine[];
  payments: PaymentRecord[];
  publicLink?: { token: string; expiresAt: string; revoked: boolean; views: number };
}
