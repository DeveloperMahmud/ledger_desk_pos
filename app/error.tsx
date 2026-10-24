"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="grid min-h-[70vh] place-items-center p-5"><div className="card-shadow max-w-md rounded-3xl border border-[#f0d9d9] bg-white p-9 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle size={25} /></span><h1 className="heading mt-6 text-2xl font-extrabold text-[#17263f]">Something went wrong</h1><p className="mt-3 text-sm leading-6 text-[#7b8697]">Your data was not changed. Try loading this screen again.</p><button onClick={reset} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-5 py-3 text-xs font-extrabold text-white"><RefreshCw size={15} /> Try again</button></div></main>;
}
