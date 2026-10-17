import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Link href="/" aria-label="Zahra's home" className="mb-10">
        <BrandLogo size="lg" priority />
      </Link>
      <div className="w-full max-w-md border border-sand bg-white p-8 sm:p-10">
        <h1 className="font-display text-4xl font-medium">{title}</h1>
        <p className="mb-8 mt-2 text-stone">{subtitle}</p>
        {children}
      </div>
      {footer && <p className="mt-6 text-sm text-stone">{footer}</p>}
    </main>
  );
}
