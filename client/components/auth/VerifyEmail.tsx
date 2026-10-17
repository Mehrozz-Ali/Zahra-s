"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { useVerifyEmailMutation } from "@/services/authApi";

type State = { kind: "working" } | { kind: "done"; message: string } | { kind: "failed"; message: string };

/** Confirms the email from the link once on load. Safe to see twice (a refresh, a double click): the server reports "already confirmed". */
export function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [verify] = useVerifyEmailMutation();
  const [state, setState] = useState<State>({ kind: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // React strict mode runs effects twice in development; only call the server once
    verify({ token }).unwrap().then((r) => setState({ kind: "done", message: r.message }), (e) => setState({ kind: "failed", message: getErrorMessage(e, "We could not confirm your email.") }));
  }, [token, verify]);

  if (!token) return <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">This confirmation link is incomplete. Open the link from your email again, or log in and ask for a new one.</p>;
  if (state.kind === "working") return <p role="status" className="text-stone">Confirming your email...</p>;
  if (state.kind === "failed") {
    return (
      <div className="space-y-4">
        <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">{state.message}</p>
        <Link href="/account" className="inline-block underline underline-offset-4">Log in to get a new link</Link>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <p role="status" className="bg-green-50 p-4 text-sm text-green-900">{state.message}</p>
      <Link href="/shop" className="inline-block bg-ink px-6 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Start shopping</Link>
    </div>
  );
}
