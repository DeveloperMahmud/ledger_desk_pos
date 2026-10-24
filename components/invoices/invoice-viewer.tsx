"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Banknote, CheckCircle2, Mail, Paperclip, Printer, Share2, X } from "lucide-react";
import type { Invoice, PaymentMethod } from "@/lib/invoicing/types";
import { invoiceTotals } from "@/lib/invoicing/rules";
import { createLiveInvoiceLink, loadLiveInvoice, queueLiveInvoiceEmail, recordLiveInvoicePayment } from "@/lib/invoicing/repository";
import { formatMoney } from "@/lib/inventory/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { InvoiceDocument } from "./invoice-document";

export function InvoiceViewer({ initialInvoice, invoiceId }: { initialInvoice?: Invoice; invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | undefined>(initialInvoice);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank");
  const [account, setAccount] = useState("City Bank Business");
  const [copied, setCopied] = useState(false);
  const [emailQueued, setEmailQueued] = useState(false);
  const [dataMode, setDataMode] = useState<"preview" | "loading" | "live" | "error">(isSupabaseConfigured() ? "loading" : "preview");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    loadLiveInvoice(invoiceId)
      .then((record) => { if (active) { setInvoice(record); setDataMode("live"); } })
      .catch((error) => { if (active) { setDataMode("error"); setActionError(error instanceof Error ? error.message : "Invoice could not be loaded."); } });
    return () => { active = false; };
  }, [invoiceId]);

  if (!invoice) {
    return <div className="grid min-h-screen place-items-center bg-[#edf0f5] text-sm font-bold text-[#657186]">{dataMode === "error" ? actionError : "Loading invoice..."}</div>;
  }

  const totals = invoiceTotals(invoice);

  async function recordPayment() {
    const value = Number(amount);
    if (!invoice || !Number.isFinite(value) || value <= 0 || value > totals.due) return;
    setSaving(true);
    setActionError("");
    try {
      const paymentId = dataMode === "live" ? await recordLiveInvoicePayment(invoice.id, value, method, account, "Manual entry") : `pay-${Date.now()}`;
      setInvoice((current) => current ? ({ ...current, status: value >= totals.due ? "paid" : "partially_paid", payments: [...current.payments, { id: paymentId, amount: value, method, account, paidAt: "Today", reference: "Manual entry" }] }) : current);
      setPaymentOpen(false);
      setAmount("");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Payment could not be recorded.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!invoice) return;
    setActionError("");
    try {
      const token = dataMode === "live" ? await createLiveInvoiceLink(invoice.id) : invoice.publicLink?.token || "demo-invoice-018";
      await navigator.clipboard?.writeText(`${window.location.origin}/public/invoice/${token}`);
      setCopied(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Secure link could not be created.");
    }
  }

  async function queueEmail() {
    if (!invoice) return;
    setActionError("");
    try {
      if (dataMode === "live") await queueLiveInvoiceEmail(invoice.id);
      setEmailQueued(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Invoice email could not be queued.");
    }
  }

  return <div className="min-h-screen bg-[#edf0f5]">
    <div className="no-print sticky top-0 z-20 border-b border-[#dfe3e9] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1250px] flex-wrap items-center gap-2">
        <Link href="/invoices" className="mr-2 rounded-lg p-2 text-[#687589]"><ArrowLeft size={18} /></Link>
        <div className="mr-auto"><h1 className="text-sm font-extrabold text-[#26354b]">{invoice.number}</h1><p className="text-[10px] text-[#8d96a4]">{invoice.clientName} · {formatMoney(totals.due)} due · <span className="uppercase">{dataMode}</span></p></div>
        <button onClick={queueEmail} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] px-3 py-2.5 text-xs font-bold text-[#566478]">{emailQueued ? <CheckCircle2 size={14} /> : <Mail size={14} />} {emailQueued ? "Queued" : "Email"}</button>
        <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] px-3 py-2.5 text-xs font-bold text-[#566478]">{copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />} {copied ? "Copied" : "Share"}</button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] px-3 py-2.5 text-xs font-bold text-[#566478]"><Printer size={14} /> Print/PDF</button>
        {totals.due > 0 && invoice.status !== "draft" && <button onClick={() => setPaymentOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white"><Banknote size={14} /> Record payment</button>}
      </div>
    </div>
    <div className="p-4 py-8 print:p-0">
      {actionError && <p role="alert" className="no-print mx-auto mb-4 max-w-[850px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{actionError}</p>}
      <InvoiceDocument invoice={invoice} />
      <div className="no-print mx-auto mt-5 max-w-[850px] rounded-2xl border border-[#e1e5eb] bg-white p-5">
        <h2 className="text-sm font-extrabold text-[#2d3b51]">Payment history</h2>
        <div className="mt-4 space-y-3">{invoice.payments.length ? invoice.payments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#f7f8fa] p-3"><span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Banknote size={15} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold text-[#415068]">{formatMoney(payment.amount)} · {payment.method.replace("_", " ")}</p><p className="mt-1 text-[9px] text-[#929ba8]">{payment.account} · {payment.paidAt}</p></div>{payment.proofName && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#5870af]"><Paperclip size={11} />{payment.proofName}</span>}</div>) : <p className="text-[10px] text-[#929ba8]">No payment recorded yet.</p>}</div>
      </div>
    </div>
    {paymentOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#111c2d]/55 p-4" role="dialog" aria-modal="true" aria-label="Record payment"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8c95a3]">Manual payment</p><h2 className="mt-1 text-lg font-extrabold text-[#26354b]">Record payment</h2><p className="mt-1 text-xs text-[#8993a1]">Outstanding {formatMoney(totals.due)}</p></div><button aria-label="Close payment" onClick={() => setPaymentOpen(false)}><X size={18} /></button></div><label className="mt-5 block text-xs font-bold text-[#4d5b70]">Amount<input aria-label="Payment amount" type="number" className="mt-2 h-11 w-full rounded-xl border border-[#dce1e8] px-3" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="mt-4 block text-xs font-bold text-[#4d5b70]">Method<select aria-label="Payment method" className="mt-2 h-11 w-full rounded-xl border border-[#dce1e8] px-3" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}><option value="cash">Cash</option><option value="bank">Bank</option><option value="online_bank">Online bank</option><option value="mobile_banking">Mobile banking</option></select></label><label className="mt-4 block text-xs font-bold text-[#4d5b70]">Account<input aria-label="Payment account" className="mt-2 h-11 w-full rounded-xl border border-[#dce1e8] px-3" value={account} onChange={(event) => setAccount(event.target.value)} /></label><button disabled={saving} onClick={recordPayment} className="mt-6 w-full rounded-xl bg-[#246bfd] py-3 text-xs font-extrabold text-white disabled:opacity-60">{saving ? "Posting..." : "Post payment"}</button></div></div>}
    <style jsx global>{`.invoice-paper{min-height:297mm}@media print{.invoice-paper{width:210mm;min-height:297mm}}`}</style>
  </div>;
}
