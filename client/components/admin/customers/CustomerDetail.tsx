"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useGetAdminCustomerQuery, useSetCustomerActiveMutation } from "@/services/adminApi";

export function CustomerDetail({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useGetAdminCustomerQuery(id, { refetchOnMountOrArgChange: true });
  const [setActive, { isLoading: saving }] = useSetCustomerActiveMutation();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <div role="status" aria-label="Loading customer" className="h-96 animate-pulse bg-sand/60 motion-reduce:animate-none" />;
  if (error || !data) {
    const missing = typeof error === "object" && error !== null && "status" in error && error.status === 404;
    return <p role="alert" className="bg-red-50 p-5 text-red-800">{missing ? "This customer does not exist." : getErrorMessage(error, "The customer could not be loaded.")} {missing ? <Link href="/admin/customers" className="underline underline-offset-4">Back to customers</Link> : <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button>}</p>;
  }
  const { customer: c, recentOrders } = data;

  const toggle = async () => {
    if (c.isActive && !window.confirm(`Deactivate ${c.name}? They will be unable to log in until you reactivate them.`)) return;
    setMessage(null);
    try { setMessage({ ok: true, text: await setActive({ id: c._id, isActive: !c.isActive }).unwrap() }); }
    catch (e) { setMessage({ ok: false, text: getErrorMessage(e, "Could not update the customer.") }); }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/customers" className="text-sm underline underline-offset-4">← All customers</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-5xl">{c.name}</h1>
          <span className={clsx("px-2 py-0.5 text-xs", c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{c.isActive ? "Active" : "Deactivated"}</span>
        </div>
      </div>

      <div aria-live="polite">{message && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")}>{message.text}</p>}</div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="profile" className="min-w-0 space-y-3 border border-sand bg-white p-5">
          <h2 id="profile" className="font-display text-2xl">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-stone">Email</dt><dd className="break-all">{c.email}</dd></div>
            <div><dt className="text-stone">Phone</dt><dd>{c.phone || "—"}</dd></div>
            <div><dt className="text-stone">Joined</dt><dd>{formatDate(c.createdAt)}</dd></div>
            {c.lastLoginAt && <div><dt className="text-stone">Last login</dt><dd>{formatDate(c.lastLoginAt)}</dd></div>}
          </dl>
          <button type="button" disabled={saving} onClick={toggle} className="h-10 border border-ink px-4 text-sm hover:bg-ink hover:text-ivory disabled:opacity-50">{c.isActive ? "Deactivate account" : "Reactivate account"}</button>
        </section>

        <section aria-labelledby="stats" className="min-w-0 border border-sand bg-white p-5">
          <h2 id="stats" className="font-display text-2xl">Spending</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            <div><dt className="text-sm text-stone">Orders</dt><dd className="font-display text-4xl tabular-nums">{c.orderCount}</dd></div>
            <div><dt className="text-sm text-stone">Total spent</dt><dd className="font-display text-3xl tabular-nums">{formatPrice(c.totalSpent)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-stone">Counts orders that are not cancelled. Spending counts orders that are paid or delivered.</p>
        </section>

        <section aria-labelledby="addr" className="min-w-0 border border-sand bg-white p-5">
          <h2 id="addr" className="font-display text-2xl">Saved addresses</h2>
          {c.addresses && c.addresses.length > 0 ? (
            <ul className="mt-3 space-y-3 text-sm">
              {c.addresses.map((a, i) => (
                <li key={a._id ?? i}>
                  <span className="font-medium">{a.fullName}</span>{a.isDefault && <span className="ml-2 text-xs text-stone">Default</span>}
                  <span className="block text-stone">{[a.line1, a.line2, a.city, a.province, a.postalCode].filter(Boolean).join(", ")}</span>
                  <span className="block text-stone">{a.phone}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-stone">No saved addresses.</p>}
        </section>
      </div>

      <section aria-labelledby="orders" className="space-y-3">
        <h2 id="orders" className="font-display text-3xl">Recent orders</h2>
        {recentOrders.length === 0 ? <p className="border border-sand bg-white p-8 text-center text-stone">This customer has not placed an order yet.</p> : (
          <div className="relative overflow-x-auto border border-sand bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-sand text-stone">{["Order", "Payment", "Status", "Total"].map((h) => <th key={h} scope="col" className={clsx("px-4 py-3 font-normal", h === "Total" && "text-right")}>{h}</th>)}</tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id} className="border-b border-sand/60 last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium"><Link href={`/admin/orders/${o._id}`} className="hover:text-rose-dark">{o.orderNumber}</Link><span className="block text-xs font-normal text-stone">{formatDate(o.createdAt)}</span></th>
                    <td className="px-4 py-3"><PaymentBadge method={o.paymentMethod} status={o.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
