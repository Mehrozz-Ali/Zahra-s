import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send a reset link."
      footer={<>Remembered it? <Link href="/auth/login" className="underline underline-offset-4">Back to log in</Link></>}
    >
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
