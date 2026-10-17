"use client";

import { useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { useAuth } from "@/hooks/useAuth";
import { useResendVerificationMutation } from "@/services/authApi";

/** Shown until the customer confirms their email. Confirming is encouraged, not required to shop. */
export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [resend, { isLoading }] = useResendVerificationMutation();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  if (!user || user.isEmailVerified) return null;

  const send = async () => {
    setResult(null);
    try { setResult({ ok: true, text: await resend().unwrap() }); }
    catch (e) { setResult({ ok: false, text: getErrorMessage(e, "We could not send the email. Please try again.") }); }
  };

  return (
    <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium">Please confirm your email address</p>
      <p className="mt-1">We sent a link to <strong className="break-all">{user.email}</strong>. Confirming lets us send you order updates reliably. Check your spam folder if you cannot find it.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={send} disabled={isLoading} className="h-9 border border-amber-900 px-3 hover:bg-amber-100 disabled:opacity-60">{isLoading ? "Sending..." : "Send the link again"}</button>
        <span aria-live="polite" className={result && !result.ok ? "text-red-800" : ""}>{result?.text}</span>
      </div>
    </div>
  );
}
