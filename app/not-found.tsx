import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f5f7fa] p-5"><div className="card-shadow max-w-md rounded-3xl border border-[#e2e6ed] bg-white p-9 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf2ff] text-[#4562b2]"><SearchX size={26} /></span><p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#8792a3]">404</p><h1 className="heading mt-2 text-2xl font-extrabold text-[#17263f]">Page not found</h1><p className="mt-3 text-sm leading-6 text-[#7b8697]">This page may have moved, or the link is no longer available.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#246bfd] px-5 py-3 text-xs font-extrabold text-white"><ArrowLeft size={15} /> Back to dashboard</Link></div></main>;
}
