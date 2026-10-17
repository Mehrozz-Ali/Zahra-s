"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLogoutMutation } from "@/services/authApi";

interface NavItem { label: string; href?: string; phase?: number; exact?: boolean; children?: NavItem[] }

// Pages that are not built yet are shown but not clickable, with the phase that adds them.
const ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Articles", href: "/admin/articles", children: [{ label: "All Articles", href: "/admin/articles", exact: true }, { label: "Add Article", href: "/admin/articles/create" }] },
  { label: "Categories", href: "/admin/categories" },
  { label: "Homepage banners", href: "/admin/banners" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Coupons", href: "/admin/coupons" },
  { label: "Analytics", href: "/admin/analytics" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();
  const active = (href: string, exact = false) => (exact || href === "/admin" ? pathname === href : pathname.startsWith(href));

  const row = (item: NavItem, nested = false) => {
    const base = clsx("flex items-center justify-between px-4 py-2.5 text-sm", nested && "pl-8");
    if (item.href) {
      return (
        <Link href={item.href} onClick={onNavigate} aria-current={active(item.href, item.exact) ? "page" : undefined} className={clsx(base, active(item.href, item.exact) ? "bg-ivory text-ink" : "text-ivory/85 hover:bg-white/10")}>
          {item.label}
        </Link>
      );
    }
    return (
      <span aria-disabled="true" className={clsx(base, "cursor-not-allowed text-ivory/40")}>
        {item.label}{item.phase && <span className="text-[10px] uppercase tracking-wider">Phase {item.phase}</span>}
      </span>
    );
  };

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <ul className="flex-1 space-y-0.5">
        {ITEMS.map((item) => (
          <li key={item.label}>
            {row(item)}
            {item.children && <ul>{item.children.map((c) => <li key={c.label}>{row(c, true)}</li>)}</ul>}
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-0.5 border-t border-white/15 pt-4">
        <Link href="/" className="block px-4 py-2.5 text-sm text-ivory/85 hover:bg-white/10">View store</Link>
        <button type="button" disabled={isLoading} onClick={async () => { await logout().unwrap().catch(() => undefined); router.replace("/auth/login"); }} className="block w-full px-4 py-2.5 text-left text-sm text-ivory/85 hover:bg-white/10 disabled:opacity-60">
          Logout
        </button>
      </div>
    </nav>
  );
}
