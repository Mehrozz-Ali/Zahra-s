import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your orders and wishlist."
      footer={<>New here? <Link href="/auth/register" className="underline underline-offset-4">Create an account</Link></>}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
