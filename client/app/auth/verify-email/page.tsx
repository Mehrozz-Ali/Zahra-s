import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export const metadata: Metadata = { title: "Confirm email", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell title="Confirm your email" subtitle="One moment while we check your link." footer={<Link href="/account" className="underline underline-offset-4">Go to my account</Link>}>
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
