import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Faster checkout and order tracking."
      footer={<>Already have an account? <Link href="/auth/login" className="underline underline-offset-4">Log in</Link></>}
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
