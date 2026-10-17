"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { DebouncedInput } from "@/components/shop/DebouncedInput";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useGetAdminCustomersQuery, useSetCustomerActiveMutation } from "@/services/adminApi";
import { IconAction } from "@/components/ui/IconAction";

const field = "h-10 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";

export function CustomerManager() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const { data, isLoading, isFetching, error, refetch } = useGetAdminCustomersQuery({ page, status, ...(q && { q }) }, { refetchOnMountOrArgChange: true });
  const [setActive, { isLoading: saving }] = useSetCustomerActiveMutation();

  const toggle = async (id: string, name: string, isActive: boolean) => {
    if (!isActive && !window.confirm(`Deactivate ${name}? They will be signed out and unable to log in until you reactivate them.`)) return;
    setMessage(null);
    try { setMessage({ ok: true, text: await setActive({ id, isActive }).unwrap() }); }
    catch (e) { setMessage({ ok: false, text: getErrorMessage(e, "Could not update the customer.") }); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-5xl">Customers</h1><p className="text-sm text-stone">Everyone who has registered. Deactivating blocks their account from signing in.</p></div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><label htmlFor="c-search" className="block text-xs text-stone">Search</label>
          <DebouncedInput id="c-search" type="search" value={q} onCommit={(v: string) => { setQ(v); setPage(1); }} placeholder="Name, email or phone" className={`${field} w-64`} /></div>
        <div className="space-y-1"><label htmlFor="c-status" className="block text-xs text-stone">Status</label>
          <select id="c-status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className={field}><option value="all">All</option><option value="active">Active</option><option value="inactive">Deactivated</option></select></div>
      </div>

      <div aria-live="polite">{message && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>{message.text}</p>}</div>

      {isLoading ? <div role="status" aria-label="Loading customers" className="h-64 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Customers could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.customers.length === 0 ? (
        <p className="border border-sand bg-white p-10 text-center text-stone">{q || status !== "all" ? "No customers match these filters." : "No customers yet."}</p>
      ) : (
        <div className={clsx("relative overflow-x-auto border border-sand bg-white", isFetching && "opacity-70")}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead><tr className="border-b border-sand text-stone">{["Customer", "Phone", "Orders", "Total spent", "Joined", "Status", ""].map((h, i) => <th key={i} scope="col" className={clsx("px-4 py-3 font-normal", h === "Total spent" && "text-right")}>{h || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c._id} className="border-b border-sand/60 align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium"><Link href={`/admin/customers/${c._id}`} className="hover:text-rose-dark">{c.name}</Link><span className="block text-xs font-normal text-stone">{c.email}</span></th>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3"><span className={clsx("inline-block px-2 py-0.5 text-xs", c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{c.isActive ? "Active" : "Deactivated"}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <IconAction icon="view" label={`View ${c.name}`} href={`/admin/customers/${c._id}`} className="mr-2 align-middle" />
                    <button type="button" disabled={saving} onClick={() => toggle(c._id, c.name, !c.isActive)} className="underline underline-offset-4 hover:text-rose-dark disabled:opacity-50">{c.isActive ? "Deactivate" : "Reactivate"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Customer pages" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} customers)</span>
          <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
