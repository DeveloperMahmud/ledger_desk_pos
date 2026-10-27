"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, FileText, Plus, Save, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceDocument } from "./invoice-document";
import type { Invoice, InvoiceLine, InvoiceTemplate } from "@/lib/invoicing/types";
import { invoiceTotals } from "@/lib/invoicing/rules";
import { issueLiveInvoice, loadInvoiceEditorOptions, saveLiveInvoiceDraft, type InvoiceEditorClient, type InvoiceEditorProduct } from "@/lib/invoicing/repository";
import { formatMoney } from "@/lib/inventory/rules";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";
import { ClientFormModal } from "@/components/crm/client-form-modal";

const baseInvoice: Invoice = {
  id: "draft-preview", number: "Next invoice number", clientId: "client-bright", clientName: "Bright Dental", clientEmail: "accounts@bright.example", status: "draft", template: "modern", currency: "BDT", issueDate: "2026-10-24", dueDate: "2026-11-07", title: "Website and creative services", terms: "Payment due within 14 days.", payments: [],
  lines: [
    { id: "studio-1", kind: "service", description: "Website development milestone", quantity: 1, unitPrice: 45000, discount: 0, taxRate: 0, unit: "Project" },
    { id: "studio-2", catalogItemId: "premium-paper", kind: "product", description: "Premium Matte Paper", quantity: 20, unitPrice: 35, discount: 0, taxRate: 0, unit: "Sheet" },
  ],
};

export function InvoiceStudio() {
  const router = useRouter();
  const [invoice, setInvoice] = useState(baseInvoice);
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [persistedId, setPersistedId] = useState<string>();
  const [clients, setClients] = useState<InvoiceEditorClient[]>([]);
  const [products, setProducts] = useState<InvoiceEditorProduct[]>([]);
  const [dataMode, setDataMode] = useState<"preview" | "loading" | "live" | "error">(isSupabaseConfigured() ? "loading" : "preview");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientSearch,setClientSearch]=useState("");
  const [addingClient,setAddingClient]=useState(false);
  const totals = useMemo(() => invoiceTotals(invoice), [invoice]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    loadInvoiceEditorOptions().then((options) => {
      if (!active) return;
      setClients(options.clients);
      setProducts(options.products);
      const client = options.clients[0];
      const product = options.products[0];
      setInvoice((current) => ({ ...current, clientId: client?.id || "", clientName: client?.name || "Select a client", clientEmail: client?.email || "", lines: current.lines.map((line) => line.kind === "product" && product ? { ...line, catalogItemId: product.id, description: product.name, unitPrice: product.price, unit: product.unit } : line) }));
      setDataMode("live");
    }).catch((error) => { if (active) { setDataMode("error"); setActionError(error instanceof Error ? error.message : "Invoice options could not be loaded."); } });
    return () => { active = false; };
  }, []);

  function changed(patch: Partial<Invoice>) { setInvoice((current) => ({ ...current, ...patch })); setSaved(false); }
  function updateLine(id: string, patch: Partial<InvoiceLine>) { setInvoice((current) => ({ ...current, lines: current.lines.map((line) => line.id === id ? { ...line, ...patch } : line) })); setSaved(false); }
  function addLine() { setInvoice((current) => ({ ...current, lines: [...current.lines, { id: `studio-${crypto.randomUUID()}`, kind: "service", description: "New service", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, unit: "Service" }] })); setSaved(false); }
  function selectClient(clientId: string) { const client = clients.find((item) => item.id === clientId); if (client) changed({ clientId: client.id, clientName: client.name, clientEmail: client.email }); }
  function selectProduct(lineId: string, productId: string) { const product = products.find((item) => item.id === productId); if (product) updateLine(lineId, { kind: "product", catalogItemId: product.id, description: product.name, unitPrice: product.price, unit: product.unit }); }

  async function saveDraft() {
    setActionError("");
    if (dataMode !== "live") { setSaved(true); return invoice.id; }
    if (!invoice.clientId) { setActionError("Create or select a client first."); return; }
    if (!invoice.lines.length) { setActionError("Add at least one invoice line."); return; }
    if (invoice.lines.some((line) => line.kind === "product" && !line.catalogItemId)) { setActionError("Select a catalog product for every product line."); return; }
    setSaving(true);
    try {
      const id = await saveLiveInvoiceDraft(invoice, persistedId);
      setPersistedId(id);
      setSaved(true);
      return id;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Draft could not be saved.");
    } finally { setSaving(false); }
  }

  async function issueInvoice() {
    const id = await saveDraft();
    if (!id || dataMode !== "live") { if (dataMode !== "live") setActionError("Preview draft saved locally. Connect Supabase to issue it."); return; }
    setSaving(true);
    try { await issueLiveInvoice(id); router.push(`/invoices/${id}`); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Invoice could not be issued."); }
    finally { setSaving(false); }
  }

  return <div className="min-h-screen bg-[#edf0f5]">
    <div className="no-print sticky top-0 z-20 border-b border-[#dfe3e9] bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-[1550px] flex-wrap items-center gap-3">
      <Link href="/invoices" className="rounded-lg p-2 text-[#687589]"><ArrowLeft size={18} /></Link>
      <div className="mr-auto"><h1 className="text-sm font-extrabold text-[#26354b]">Invoice Studio</h1><p className="text-[10px] text-[#8d96a4]">{invoice.number} · <span className="uppercase">{dataMode}</span></p></div>
      <button onClick={() => setPreview(!preview)} className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3e9] px-4 py-2.5 text-xs font-bold text-[#566478]"><Eye size={15} />{preview ? "Edit" : "Preview"}</button>
      <button disabled={saving} onClick={saveDraft} className="inline-flex items-center gap-2 rounded-xl bg-[#17263f] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{saved ? <Check size={15} /> : <Save size={15} />} {saving ? "Saving..." : saved ? "Saved" : "Save draft"}</button>
      <button disabled={saving} onClick={issueInvoice} className="inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-60"><Send size={15} /> Issue invoice</button>
    </div></div>
    {actionError && <p role="alert" className="no-print mx-auto mt-4 max-w-[1500px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{actionError}</p>}
    {preview ? <div className="p-4 py-8"><InvoiceDocument invoice={invoice} /></div> : <div className="mx-auto grid max-w-[1550px] gap-5 p-4 lg:grid-cols-[1fr_360px] lg:p-7">
      <main className="space-y-5">
        <section className="card-shadow rounded-2xl border border-[#e2e6ec] bg-white p-5"><h2 className="text-sm font-extrabold text-[#2c3a50]">Invoice details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Client"><div className="flex gap-2"><div className="min-w-0 flex-1"><input aria-label="Search clients" className="input mb-2" placeholder="Search client..." value={clientSearch} onChange={event=>setClientSearch(event.target.value)}/><select className="input" value={invoice.clientId} onChange={(event) => selectClient(event.target.value)}><option value="">Select a client</option>{dataMode === "live" ? clients.filter(client=>`${client.name} ${client.email}`.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => <option key={client.id} value={client.id}>{client.name}{client.email?` · ${client.email}`:""}</option>) : <><option value="client-bright">Bright Dental</option><option value="client-kite">Kite Logistics</option><option value="client-mango">Mango Home</option></>}</select></div><button type="button" onClick={()=>setAddingClient(true)} className="self-end rounded-xl bg-[#edf2ff] px-3 py-3 text-[10px] font-extrabold text-[#3157be]">+ New</button></div>{!clients.length&&dataMode==="live"&&<p className="mt-2 text-[10px] text-amber-700">No clients yet. Create the first client without losing this invoice.</p>}</Field>
          {invoice.clientId&&<div className="sm:col-span-2 -mt-2 text-right"><Link href={`/clients?client=${invoice.clientId}`} className="text-[10px] font-extrabold text-[#3157be]">View or edit selected client →</Link></div>}
          <Field label="Invoice title"><input className="input" value={invoice.title} onChange={(event) => changed({ title: event.target.value })} /></Field>
          <Field label="Issue date"><input type="date" className="input" value={invoice.issueDate} onChange={(event) => changed({ issueDate: event.target.value })} /></Field>
          <Field label="Due date"><input type="date" className="input" value={invoice.dueDate} onChange={(event) => changed({ dueDate: event.target.value })} /></Field>
        </div></section>
        <section className="card-shadow overflow-hidden rounded-2xl border border-[#e2e6ec] bg-white"><div className="flex items-center justify-between border-b border-[#eceef2] p-5"><div><h2 className="text-sm font-extrabold text-[#2c3a50]">Line items</h2><p className="mt-1 text-[10px] text-[#9199a6]">Mix services and stock-tracked products</p></div><button onClick={addLine} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3157be]"><Plus size={14} /> Add line</button></div>
          <div className="divide-y divide-[#eff1f4]">{invoice.lines.map((line) => <div key={line.id} className="grid gap-3 p-5 sm:grid-cols-[1.4fr_.5fr_.7fr_auto]"><div><input aria-label={`Description ${line.id}`} className="input" value={line.description} onChange={(event) => updateLine(line.id, { description: event.target.value })} /><select aria-label={`Type ${line.id}`} className="mt-2 rounded-lg border border-[#e1e5eb] px-2 py-1.5 text-[10px]" value={line.kind} onChange={(event) => { const kind = event.target.value as InvoiceLine["kind"]; if (kind === "product" && products[0]) selectProduct(line.id, products[0].id); else updateLine(line.id, { kind, catalogItemId: undefined }); }}><option value="service">Service</option><option value="product">Product</option></select>{line.kind === "product" && dataMode === "live" && <select aria-label={`Catalog product ${line.id}`} className="ml-2 mt-2 rounded-lg border border-[#e1e5eb] px-2 py-1.5 text-[10px]" value={line.catalogItemId || ""} onChange={(event) => selectProduct(line.id, event.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.stock} {product.unit}</option>)}</select>}</div><Field label="Qty"><input aria-label={`Quantity ${line.id}`} type="number" min="0.01" className="input" value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} /></Field><Field label="Unit price"><input aria-label={`Unit price ${line.id}`} type="number" min="0" className="input" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: Number(event.target.value) })} /></Field><button aria-label={`Delete ${line.description}`} onClick={() => { setInvoice((current) => ({ ...current, lines: current.lines.filter((item) => item.id !== line.id) })); setSaved(false); }} className="self-end rounded-lg p-3 text-[#a0a8b4] hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div>)}</div>
        </section>
      </main>
      <aside className="space-y-5"><section className="card-shadow rounded-2xl border border-[#e2e6ec] bg-white p-5"><h2 className="text-sm font-extrabold text-[#2c3a50]">Template</h2><div className="mt-4 grid grid-cols-3 gap-2">{(["modern", "classic", "minimal"] as InvoiceTemplate[]).map((template) => <button key={template} onClick={() => changed({ template })} className={cn("rounded-xl border p-2 text-center", invoice.template === template ? "border-[#7f9bf5] bg-[#edf2ff]" : "border-[#e2e6ec]")}><span className={cn("mx-auto block h-12 rounded-md", template === "modern" ? "bg-[#17263f]" : template === "classic" ? "border-y-4 border-[#9a704d] bg-[#fbf7f2]" : "border border-[#cfd5dd] bg-white")} /><span className="mt-2 block text-[9px] font-extrabold capitalize text-[#566478]">{template}</span></button>)}</div></section>
        <section className="card-shadow rounded-2xl border border-[#e2e6ec] bg-white p-5"><h2 className="text-sm font-extrabold text-[#2c3a50]">Summary</h2><dl className="mt-4 space-y-3 text-xs"><Summary label="Subtotal" value={formatMoney(totals.subtotal)} /><Summary label="Discount" value={formatMoney(totals.lineDiscount)} /><Summary label="Tax" value={formatMoney(totals.tax)} /><div className="border-t border-[#e6e9ee] pt-3"><Summary label="Total" value={formatMoney(totals.total)} strong /></div></dl></section>
        <div className="rounded-2xl border border-[#dce4f8] bg-[#f1f5ff] p-5"><FileText size={18} className="text-[#4163bd]" /><p className="mt-3 text-xs font-extrabold text-[#3d5591]">Stock-aware invoicing</p><p className="mt-2 text-[10px] leading-5 text-[#6b7aa1]">Product quantities are validated and deducted only when the invoice is issued.</p></div>
      </aside>
    </div>}
    {addingClient&&<ClientFormModal live={dataMode==="live"} onClose={()=>setAddingClient(false)} onCreated={({id,name,email})=>{setClients(current=>[{id,name,email},...current]);changed({clientId:id,clientName:name,clientEmail:email});setAddingClient(false);}}/>}
    <style jsx global>{`.input{height:42px;width:100%;border:1px solid #dfe4ea;border-radius:10px;padding:0 12px;font-size:12px;outline:none;background:#fff}.input:focus{border-color:#7897fa;box-shadow:0 0 0 4px #e7edff}.invoice-paper{min-height:297mm}@media print{.invoice-paper{width:210mm;min-height:297mm}}`}</style>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-[10px] font-bold text-[#778397]">{label}</span>{children}</label>; }
function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex justify-between gap-4"><dt className={cn("text-[#7c8797]", strong && "font-extrabold text-[#344258]")}>{label}</dt><dd className={cn("font-bold text-[#46556b]", strong && "text-base font-extrabold text-[#1f2e45]")}>{value}</dd></div>; }
