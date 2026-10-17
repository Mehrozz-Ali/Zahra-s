"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

/** Wrap protected pages. The API is the real gatekeeper; this only decides what the browser shows. */
export function AuthGuard({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) return <p role="status" className="p-10 text-center text-stone">Loading...</p>;
  if (role && user.role !== role) return <p role="alert" className="p-10 text-center">You do not have access to this page.</p>;
  return <>{children}</>;
}
