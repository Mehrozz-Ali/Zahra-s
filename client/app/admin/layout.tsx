import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

// The API checks the admin role on every request. This guard only decides what the browser shows.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
