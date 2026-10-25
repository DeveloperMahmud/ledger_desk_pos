"use client";

import { ArrowRight, CheckCircle2, LoaderCircle, LockKeyhole, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthMode = "signin" | "signup";

export function AuthForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    if (!configured) {
      setError("Supabase keys are not configured yet. You can continue using preview mode.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    if (!email || password.length < 8) {
      setError("Enter a valid email and a password with at least 8 characters.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] } } });
    setPending(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm it, then sign in.");
      return;
    }

    router.push(nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/setup");
    router.refresh();
  }

  async function resetPassword() {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value.trim();
    if (!configured || !email) { setError("Enter your email first, then choose reset password."); return; }
    const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (resetError) setError(resetError.message); else setMessage("Password reset link sent. Check your email.");
  }

  return (
    <div className="grid min-h-screen bg-[#f5f7fa] lg:grid-cols-[1fr_480px]">
      <section className="relative hidden overflow-hidden bg-[#17263f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-1/3 size-96 rounded-full bg-blue-500/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#6d8dff]"><Sparkles size={19} /></span><span className="heading text-lg font-extrabold">LedgerDesk</span></Link>
        <div className="relative max-w-xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">Secure business workspace</p><h1 className="heading mt-4 text-4xl font-extrabold leading-tight">Your inventory, invoices and agency accounts—privately separated.</h1><div className="mt-8 grid gap-3 text-sm text-slate-300">{["Workspace-isolated data", "Audited stock and accounting", "Professional client invoices"].map((item) => <p key={item} className="flex items-center gap-3"><CheckCircle2 size={17} className="text-emerald-400" />{item}</p>)}</div></div>
        <p className="relative text-xs text-slate-500">Supabase authentication activates after final environment setup.</p>
      </section>
      <main className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-xl bg-[#246bfd] text-white"><Sparkles size={18} /></span><span className="heading font-extrabold">LedgerDesk</span></Link>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f7b8d]">Business Super User</p>
          <h2 className="heading mt-3 text-3xl font-extrabold text-[#17263f]">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#7c8798]">{mode === "signin" ? "Sign in to open your private workspace." : "The first account becomes the workspace owner during setup."}</p>
          {!configured && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">Preview mode is active. Authentication will work after Supabase keys are added.</div>}
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-bold text-[#46556b]">Email address</span><span className="relative block"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929cab]" /><input name="email" type="email" autoComplete="email" required className="h-12 w-full rounded-xl border border-[#dce1e8] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#7897fa] focus:ring-4 focus:ring-[#e7edff]" /></span></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-[#46556b]">Password</span><span className="relative block"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929cab]" /><input name="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required className="h-12 w-full rounded-xl border border-[#dce1e8] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#7897fa] focus:ring-4 focus:ring-[#e7edff]" /></span></label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{message}</p>}
            <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#246bfd] text-xs font-extrabold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}{pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(undefined); setMessage(undefined); }} className="mt-5 w-full text-center text-xs font-bold text-[#4d63a8]">{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
          {mode === "signin" && <button onClick={resetPassword} className="mt-3 w-full text-center text-xs font-semibold text-[#7b8596]">Forgot password?</button>}
          <Link href="/" className="mt-6 block text-center text-xs text-[#8993a1]">Continue in preview mode</Link>
        </div>
      </main>
    </div>
  );
}
