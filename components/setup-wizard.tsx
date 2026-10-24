"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleDollarSign,
  FileText,
  Languages,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { defaultSetup, setupSchema, type SetupValues } from "@/lib/setup";
import { persistWorkspaceSetup } from "@/lib/setup-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Business", detail: "Workspace identity", icon: Building2 },
  { label: "Preferences", detail: "Language & finance", icon: CircleDollarSign },
  { label: "Branding", detail: "Invoice appearance", icon: Palette },
];

const choices = {
  businessType: [
    { value: "agency", label: "Agency & freelancing", description: "Clients, projects, services and inventory" },
    { value: "retail", label: "Retail business", description: "Products, inventory and invoicing" },
    { value: "service", label: "Service business", description: "Appointments, services and invoices" },
    { value: "manufacturing", label: "Manufacturing", description: "Factory module can be enabled later" },
  ],
  template: [
    { value: "modern", label: "Modern Agency", color: "from-[#233c6c] to-[#6484f4]" },
    { value: "minimal", label: "Minimal", color: "from-[#e7e9ee] to-[#fafafa]" },
    { value: "classic", label: "Classic Business", color: "from-[#204d43] to-[#6cae9a]" },
    { value: "tax", label: "Detailed Tax", color: "from-[#774125] to-[#d59461]" },
  ],
} as const;

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [savedLive, setSavedLive] = useState(false);
  const {
    register,
    control,
    setValue,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupValues>({ defaultValues: defaultSetup, resolver: zodResolver(setupSchema), mode: "onChange" });

  const values = useWatch({ control, defaultValue: defaultSetup }) as SetupValues;

  async function nextStep() {
    const valid = step === 0 ? await trigger(["businessName", "businessType"]) : true;
    if (valid) setStep((current) => Math.min(current + 1, 2));
  }

  async function completeSetup(valuesToSave: SetupValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      if (isSupabaseConfigured()) {
        await persistWorkspaceSetup(valuesToSave);
        setSavedLive(true);
      }
      setComplete(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Workspace setup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fa] px-5 soft-grid">
        <div className="card-shadow w-full max-w-lg rounded-3xl border border-[#e2e6ed] bg-white p-8 text-center sm:p-11">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><BadgeCheck size={32} /></span>
          <h1 className="heading mt-6 text-2xl font-extrabold tracking-[-.03em] text-[#17263f]">Your workspace is ready</h1>
          <p className="mt-3 text-sm leading-6 text-[#778194]">{values.businessName} is configured with {values.accountingMode} accounting and the {values.invoiceTemplate} invoice style.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20">
            Open dashboard <ArrowRight size={15} />
          </Link>
          <p className="mt-5 text-[11px] text-[#9aa2ae]">{savedLive ? "Saved securely to your Supabase workspace." : "Preview mode: connect Supabase and sign in to persist this workspace."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] lg:grid lg:grid-cols-[370px_1fr]">
      <aside className="relative overflow-hidden bg-[#17263f] px-6 py-7 text-white lg:min-h-screen lg:px-9 lg:py-10">
        <div className="absolute -left-24 top-1/3 size-72 rounded-full bg-[#315acf]/25 blur-3xl" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#6d8dff]"><Sparkles size={19} /></span>
            <span className="heading text-lg font-extrabold">LedgerDesk</span>
          </Link>

          <div className="mt-10 hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#7f91ac]">First-time setup</p>
            <h1 className="heading mt-3 text-[30px] font-extrabold leading-tight tracking-[-.04em]">Shape the workspace around your business.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">A few thoughtful choices now will tailor your inventory, invoices and accounting. Everything remains editable.</p>
          </div>

          <div className="mt-7 flex gap-2 lg:mt-12 lg:block lg:space-y-3">
            {steps.map((item, index) => (
              <div key={item.label} className={cn("flex flex-1 items-center gap-3 rounded-xl p-3 transition", index === step ? "bg-white/10" : "opacity-55")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", index < step ? "bg-emerald-400 text-[#173f34]" : index === step ? "bg-[#7e9cff] text-white" : "bg-white/10 text-slate-300")}>
                  {index < step ? <Check size={15} /> : <item.icon size={15} />}
                </span>
                <span className="hidden lg:block">
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-400">{item.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex min-h-[calc(100vh-112px)] flex-col bg-white lg:min-h-screen">
        <div className="flex items-center justify-between border-b border-[#edf0f3] px-5 py-4 sm:px-9">
          <button onClick={() => (step > 0 ? setStep(step - 1) : history.back())} className="inline-flex items-center gap-2 text-xs font-bold text-[#657186]">
            <ArrowLeft size={15} /> Back
          </button>
          <p className="text-[11px] font-semibold text-[#9aa2ae]">Step {step + 1} of 3</p>
        </div>

        <form onSubmit={handleSubmit(completeSetup)} className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-9 sm:px-9 lg:justify-center lg:py-12">
          {step === 0 && (
            <section>
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={20} /></span>
              <h2 className="heading mt-5 text-2xl font-extrabold tracking-[-.03em] text-[#17263f]">Tell us about your business</h2>
              <p className="mt-2 text-sm text-[#7a8495]">This creates a private workspace for the Business Super User.</p>

              <label className="mt-8 block">
                <span className="mb-2 block text-xs font-bold text-[#425069]">Business or agency name</span>
                <input {...register("businessName")} autoFocus placeholder="e.g. Northstar Creative Studio" className="h-12 w-full rounded-xl border border-[#dce1e8] px-4 text-sm outline-none transition focus:border-[#7292fa] focus:ring-4 focus:ring-[#e7edff]" />
                {errors.businessName && <span className="mt-1.5 block text-[11px] font-semibold text-red-600">{errors.businessName.message}</span>}
              </label>

              <div className="mt-7">
                <span className="mb-3 block text-xs font-bold text-[#425069]">Primary business type</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {choices.businessType.map((choice) => (
                    <button key={choice.value} type="button" onClick={() => setValue("businessType", choice.value)} className={cn("rounded-xl border p-4 text-left transition", values.businessType === choice.value ? "border-[#5e82f6] bg-[#f1f5ff] ring-2 ring-[#dce5ff]" : "border-[#e1e5eb] hover:border-[#b8c4d8]")}>
                      <span className="flex items-center justify-between text-xs font-extrabold text-[#26364f]">{choice.label}{values.businessType === choice.value && <Check size={15} className="text-[#246bfd]" />}</span>
                      <span className="mt-1.5 block text-[11px] leading-4 text-[#7f8999]">{choice.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><Languages size={20} /></span>
              <h2 className="heading mt-5 text-2xl font-extrabold tracking-[-.03em] text-[#17263f]">Choose your preferences</h2>
              <p className="mt-2 text-sm text-[#7a8495]">Set sensible defaults. You can change them from Settings at any time.</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-bold text-[#425069]">App & invoice language</span>
                  <select {...register("language")} className="h-12 w-full rounded-xl border border-[#dce1e8] bg-white px-4 text-sm outline-none focus:border-[#7292fa] focus:ring-4 focus:ring-[#e7edff]">
                    <option value="both">English + বাংলা</option>
                    <option value="english">English</option>
                    <option value="bangla">বাংলা</option>
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-[#425069]">Default currency</span>
                  <select {...register("currency")} className="h-12 w-full rounded-xl border border-[#dce1e8] bg-white px-4 text-sm outline-none focus:border-[#7292fa] focus:ring-4 focus:ring-[#e7edff]">
                    <option value="BDT_USD">BDT + USD</option>
                    <option value="BDT">BDT only</option>
                    <option value="USD">USD only</option>
                  </select>
                </label>
              </div>
              <div className="mt-7">
                <span className="mb-3 block text-xs font-bold text-[#425069]">Accounting experience</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "basic", title: "Basic accounting", text: "Simple income, expense, due and profit screens." },
                    { value: "full", title: "Full accounting", text: "Ledger, journal, trial balance and statements." },
                  ].map((choice) => (
                    <button key={choice.value} type="button" onClick={() => setValue("accountingMode", choice.value as "basic" | "full")} className={cn("rounded-xl border p-4 text-left transition", values.accountingMode === choice.value ? "border-[#5e82f6] bg-[#f1f5ff] ring-2 ring-[#dce5ff]" : "border-[#e1e5eb]")}>
                      <span className="flex items-center gap-2 text-xs font-extrabold text-[#26364f]"><ShieldCheck size={16} className="text-[#246bfd]" />{choice.title}</span>
                      <span className="mt-2 block text-[11px] leading-4 text-[#7f8999]">{choice.text}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-[#f7f8fa] p-4 text-[11px] leading-5 text-[#6f7989]">Both modes use the same ledger-safe data. Basic mode simply hides advanced accounting screens.</div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><FileText size={20} /></span>
              <h2 className="heading mt-5 text-2xl font-extrabold tracking-[-.03em] text-[#17263f]">Choose your first invoice style</h2>
              <p className="mt-2 text-sm text-[#7a8495]">Start professional today. Logo, colors and fields remain fully editable.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {choices.template.map((choice) => (
                  <button key={choice.value} type="button" onClick={() => setValue("invoiceTemplate", choice.value)} className={cn("group overflow-hidden rounded-2xl border text-left transition", values.invoiceTemplate === choice.value ? "border-[#5e82f6] ring-2 ring-[#dce5ff]" : "border-[#e1e5eb] hover:border-[#b8c4d8]")}>
                    <div className="h-32 bg-[#f5f6f8] p-4">
                      <div className="mx-auto h-full max-w-[170px] rounded-md bg-white p-3 shadow-sm">
                        <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${choice.color}`} />
                        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100" />
                        <div className="mt-2 h-1.5 w-3/4 rounded-full bg-slate-100" />
                        <div className="mt-6 grid grid-cols-3 gap-1"><span className="h-5 rounded bg-slate-50" /><span className="h-5 rounded bg-slate-50" /><span className={`h-5 rounded bg-gradient-to-r ${choice.color} opacity-70`} /></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs font-extrabold text-[#304058]">{choice.label}</span>
                      {values.invoiceTemplate === choice.value && <span className="grid size-6 place-items-center rounded-full bg-[#246bfd] text-white"><Check size={13} /></span>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#dfe6fa] bg-[#f3f6ff] p-4">
                <Store size={17} className="mt-0.5 shrink-0 text-[#4568cb]" />
                <p className="text-[11px] leading-5 text-[#5a6a8c]">Your selected template becomes the default. Every invoice may use a different template, and issued invoices keep their original design snapshot.</p>
              </div>
            </section>
          )}

          <div className="mt-10 flex items-center justify-between border-t border-[#edf0f3] pt-6">
            <p className="hidden text-[11px] text-[#969eaa] sm:block">Your settings are private to this workspace.</p>
            {step < 2 ? (
              <button type="button" onClick={nextStep} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20">Continue <ArrowRight size={15} /></button>
            ) : (
              <button type="submit" disabled={submitting} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20 disabled:cursor-wait disabled:opacity-60"><Sparkles size={15} /> {submitting ? "Creating..." : "Create workspace"}</button>
            )}
          </div>
          {submitError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{submitError} <Link href="/login" className="underline">Open sign in</Link></p>}
        </form>
      </main>
    </div>
  );
}
