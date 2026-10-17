"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DebouncedInput } from "@/components/shop/DebouncedInput";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useGetAdminOrdersQuery } from "@/services/adminApi";
import type { OrderStatus } from "@/types";
import { IconAction } from "@/components/ui/IconAction";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const field = "h-10 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark";
/** A date from <input type=date> to the start or end of that day in the shop's (Pakistan) time. */
const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00+05:00`).toISOString() : undefined);
const dayEnd = (d: string) => (d ? new Date(`${d}T23:59:59.999+05:00`).toISOString() : undefined);

export function OrderManager() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<"" | "cod" | "stripe">("");
  const [payment, setPayment] = useState<"" | "pending" | "paid" | "failed" | "refunded">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, error, refetch } = useGetAdminOrdersQuery({
    page, ...(status && { status }), ...(q && { q }), ...(method && { paymentMethod: method }), ...(payment && { paymentStatus: payment }),
    ...(from && { from: dayStart(from) }), ...(to && { to: dayEnd(to) }),
  }, { refetchOnMountOrArgChange: true });

  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  const counts = data?.statusCounts;
  const allCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined;
  const filtered = Boolean(q || method || payment || from || to);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-5xl">Orders</h1><p className="text-sm text-stone">Open an order to see what to pack, where it goes, and to move it along.</p></div>

      <div role="tablist" aria-label="Order status" className="flex flex-wrap gap-1">
        {[["" as const, "All", allCount] as const, ...STATUSES.map((s) => [s, s[0]!.toUpperCase() + s.slice(1), counts?.[s]] as const)].map(([value, label, count]) => (
          <button key={value || "all"} role="tab" aria-selected={status === value} type="button" onClick={() => reset(setStatus)(value)}
            className={clsx("px-3 py-1.5 text-sm", status === value ? "bg-ink text-ivory" : "bg-white hover:bg-sand/60")}>
            {label}{count !== undefined && <span className={clsx("ml-1.5 text-xs tabular-nums", status === value ? "text-ivory/70" : "text-stone")}>{count}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><label htmlFor="o-search" className="block text-xs text-stone">Search</label>
          <DebouncedInput id="o-search" type="search" value={q} onCommit={reset(setQ)} placeholder="Order no., name or phone" className={`${field} w-60`} /></div>
        <div className="space-y-1"><label htmlFor="o-method" className="block text-xs text-stone">Payment method</label>
          <select id="o-method" value={method} onChange={(e) => reset(setMethod)(e.target.value as typeof method)} className={field}><option value="">All</option><option value="cod">Cash on delivery</option><option value="stripe">Card</option></select></div>
        <div className="space-y-1"><label htmlFor="o-pay" className="block text-xs text-stone">Payment status</label>
          <select id="o-pay" value={payment} onChange={(e) => reset(setPayment)(e.target.value as typeof payment)} className={field}><option value="">All</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>
        <div className="space-y-1"><label htmlFor="o-from" className="block text-xs text-stone">From</label><input id="o-from" type="date" value={from} max={to || undefined} onChange={(e) => reset(setFrom)(e.target.value)} className={field} /></div>
        <div className="space-y-1"><label htmlFor="o-to" className="block text-xs text-stone">To</label><input id="o-to" type="date" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} className={field} /></div>
        {filtered && <button type="button" onClick={() => { setQ(""); setMethod(""); setPayment(""); setFrom(""); setTo(""); setPage(1); }} className="h-10 text-sm underline underline-offset-4">Clear filters</button>}
      </div>

      {isLoading ? <div role="status" aria-label="Loading orders" className="h-64 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Orders could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.orders.length === 0 ? (
        <p className="border border-sand bg-white p-10 text-center text-stone">{status || filtered ? "No orders match these filters." : "No orders yet. They will appear here as customers check out."}</p>
      ) : (
        <div className={clsx("relative overflow-x-auto border border-sand bg-white", isFetching && "opacity-70")}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="border-b border-sand text-stone">{["Order", "Customer", "Items", "Payment", "Status", "Total", ""].map((h, i) => <th key={i} scope="col" className={clsx("px-4 py-3 font-normal", h === "Total" && "text-right")}>{h || <span className="sr-only">Actions</span>}</th>)}</tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id} className="border-b border-sand/60 align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium"><Link href={`/admin/orders/${o._id}`} className="hover:text-rose-dark">{o.orderNumber}</Link><span className="block text-xs font-normal text-stone">{formatDate(o.createdAt)}</span></th>
                  <td className="px-4 py-3">{o.shippingAddress.fullName}<span className="block text-xs text-stone">{o.shippingAddress.city}, {o.shippingAddress.phone}</span></td>
                  <td className="px-4 py-3 tabular-nums">{o.itemCount}</td>
                  <td className="px-4 py-3"><PaymentBadge method={o.paymentMethod} status={o.paymentStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPrice(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right"><IconAction icon="view" label={`View order ${o.orderNumber ?? ""}`.trim()} href={`/admin/orders/${o._id}`} className="ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Order pages" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} orders)</span>
          <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
