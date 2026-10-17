"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLogoutMutation } from "@/services/authApi";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const isActive = (href: string) => (href === "/account" ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Account" className="flex flex-row gap-1 overflow-x-auto md:flex-col">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? "page" : undefined}
          className={clsx("whitespace-nowrap px-4 py-2.5 text-sm", isActive(l.href) ? "bg-ink text-ivory" : "hover:bg-sand/60")}
        >
          {l.label}
        </Link>
      ))}
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => { await logout().unwrap().catch(() => undefined); router.replace("/"); }}
        className="whitespace-nowrap px-4 py-2.5 text-left text-sm text-red-800 hover:bg-red-50"
      >
        Log out
      </button>
    </nav>
  );
}
