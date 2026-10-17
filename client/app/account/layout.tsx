import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/AccountNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = { title: { default: "My account", template: "%s | My account" }, robots: { index: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <AuthGuard>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[200px_1fr]">
          <AccountNav />
          <main id="main">{children}</main>
        </div>
      </AuthGuard>
      <SiteFooter />
    </>
  );
}
