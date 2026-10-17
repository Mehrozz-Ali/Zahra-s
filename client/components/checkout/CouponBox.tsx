"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { AppliedCoupon } from "@/types";

interface CouponBoxProps {
  applied: AppliedCoupon | null;
  error: string | null; // why the code that was entered does not apply
  onApply: (code: string) => void;
  onRemove: () => void;
}

/** The server checks every code (dates, minimum spend, usage limit); this box only collects it and shows the result. */
export function CouponBox({ applied, error, onApply, onRemove }: CouponBoxProps) {
  const [draft, setDraft] = useState("");

  if (applied) {
    return (
      <div className="mb-4 flex items-center justify-between gap-3 bg-green-50 p-3 text-sm text-green-900" role="status">
        <span className="flex items-center gap-2"><Tag className="h-4 w-4" aria-hidden /><span><strong>{applied.code}</strong> applied: {applied.description} (-{formatPrice(applied.discountAmount)})</span></span>
        <button type="button" onClick={() => { onRemove(); setDraft(""); }} aria-label={`Remove coupon ${applied.code}`} className="shrink-0 p-1 hover:text-green-700"><X className="h-4 w-4" aria-hidden /></button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); // never submit the surrounding page
    const code = draft.trim();
    if (code) onApply(code.toUpperCase());
  };

  return (
    <form onSubmit={submit} className="mb-4" noValidate>
      <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium">Coupon code</label>
      <div className="flex gap-2">
        <input
          id="coupon-code" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={30} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          aria-invalid={error ? true : undefined} aria-describedby={error ? "coupon-error" : undefined}
          className="h-11 min-w-0 flex-1 border border-sand bg-white px-3 uppercase outline-none focus:border-rose-dark aria-[invalid=true]:border-red-700"
        />
        <button type="submit" disabled={!draft.trim()} className="h-11 shrink-0 border border-ink px-5 text-sm uppercase tracking-widest transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50">Apply</button>
      </div>
      {error && <p id="coupon-error" role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </form>
  );
}
