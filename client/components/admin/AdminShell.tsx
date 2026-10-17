"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AdminNav } from "./AdminNav";
import { SITE } from "@/lib/site";

/** Sidebar on large screens; a slide-down menu on phones. */
export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-ivory lg:hidden">
        <Link href="/admin" className="font-display text-2xl">{SITE.name} Admin</Link>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-menu" aria-label={open ? "Close menu" : "Open menu"} className="p-2">
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </header>
      {open && <div id="admin-menu" className="fixed inset-x-0 top-14 z-20 max-h-[calc(100vh-3.5rem)] overflow-y-auto bg-ink p-3 lg:hidden"><AdminNav onNavigate={() => setOpen(false)} /></div>}

      <aside className="sticky top-0 hidden h-screen flex-col bg-ink p-4 text-ivory lg:flex">
        <Link href="/admin" className="mb-6 block px-4 pt-2 font-display text-3xl">{SITE.name}<span className="block font-sans text-[11px] uppercase tracking-widest text-ivory/60">Admin</span></Link>
        <div className="min-h-0 flex-1 overflow-y-auto"><AdminNav /></div>
      </aside>

      <main id="admin-main" className="min-w-0 bg-ivory px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
