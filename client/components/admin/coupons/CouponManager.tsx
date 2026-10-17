"use client";

import clsx from "clsx";
import { useState } from "react";
import { CouponForm } from "@/components/admin/coupons/CouponForm";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useDeleteCouponMutation, useGetCouponsQuery, useUpdateCouponMutation } from "@/services/couponApi";
import type { Coupon, CouponStatus } from "@/types";
import { IconAction } from "@/components/ui/IconAction";

const STATUS_LABEL: Record<CouponStatus, string> = { active: "Active", inactive: "Inactive", expired: "Expired", scheduled: "Scheduled", used_up: "Fully used" };
const STATUS_STYLE: Record<CouponStatus, string> = {
  active: "bg-green-50 text-green-900", inactive: "bg-stone/10 text-stone", expired: "bg-red-50 text-red-900", scheduled: "bg-sky-50 text-sky-900", used_up: "bg-amber-50 text-amber-900",
};
const FILTERS = [["all", "All"], ["active", "Active"], ["scheduled", "Scheduled"], ["expired", "Expired"], ["inactive", "Inactive"]] as const;

const when = (iso: string) => new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const valueText = (c: Coupon) => (c.discountType === "percentage" ? `${c.discountValue}%` : formatPrice(c.discountValue));

export function CouponManager() {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [message, setMessage] = useState("");
  const { data, isLoading, isFetching, error, refetch } = useGetCouponsQuery({ page, status, q: q.trim() });
  const [update] = useUpdateCouponMutation();
  const [remove] = useDeleteCouponMutation();

  const run = async (action: () => Promise<unknown>, ok: string) => {
    setMessage("");
    try { await action(); setMessage(ok); } catch (e) { setMessage(getErrorMessage(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-5xl">Coupons</h1><p className="text-sm text-stone">Customers enter a code at checkout. Every rule is checked again on the server.</p></div>
        {!editing && <button type="button" onClick={() => { setMessage(""); setEditing("new"); }} className="bg-ink px-6 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">New coupon</button>}
      </div>

      {editing && <CouponForm coupon={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      {message && <p role="status" className="bg-sand/60 p-3 text-sm">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
          {FILTERS.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }} className={clsx("px-3 py-1.5 text-sm", status === value ? "bg-ink text-ivory" : "bg-white hover:bg-sand/60")}>{label}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="coupon-search">Search coupon codes</label>
        <input id="coupon-search" type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search code" className="h-9 w-48 border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark" />
      </div>

      {isLoading ? <div role="status" aria-label="Loading coupons" className="h-40 animate-pulse bg-sand/60 motion-reduce:animate-none" /> : error || !data ? (
        <p role="alert" className="bg-red-50 p-4 text-red-800">{getErrorMessage(error, "Coupons could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : data.coupons.length === 0 ? (
        <p className="border border-sand bg-white p-8 text-center text-stone">{status === "all" && !q ? "No coupons yet. Create the first one." : "No coupons match."}</p>
      ) : (
        <div className={clsx("relative overflow-x-auto border border-sand bg-white", isFetching && "opacity-70")}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead><tr className="border-b border-sand text-stone">
              {["Code", "Discount", "Minimum order", "Used", "Valid", "Status", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-normal">{h || <span className="sr-only">Actions</span>}</th>)}
            </tr></thead>
            <tbody>
              {data.coupons.map((c) => (
                <tr key={c._id} className="border-b border-sand/60 align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium">{c.code}</th>
                  <td className="px-4 py-3">{valueText(c)}{c.maximumDiscount ? <span className="block text-xs text-stone">up to {formatPrice(c.maximumDiscount)}</span> : null}</td>
                  <td className="px-4 py-3">{c.minimumOrderAmount > 0 ? formatPrice(c.minimumOrderAmount) : "None"}</td>
                  <td className="px-4 py-3 tabular-nums">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : " / unlimited"}</td>
                  <td className="px-4 py-3 text-xs text-stone">{when(c.startDate)}<br />to {when(c.expiryDate)}</td>
                  <td className="px-4 py-3"><span className={clsx("inline-block px-2 py-0.5 text-xs font-medium", STATUS_STYLE[c.status])}>{STATUS_LABEL[c.status]}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconAction icon="edit" label={`Edit ${c.code}`} onClick={() => { setMessage(""); setEditing(c); }} />
                      <IconAction icon={c.isActive ? "hide" : "view"} label={c.isActive ? `Deactivate ${c.code}` : `Activate ${c.code}`} onClick={() => run(() => update({ id: c._id, body: { isActive: !c.isActive } }).unwrap(), c.isActive ? `${c.code} deactivated` : `${c.code} activated`)} />
                      <IconAction icon="delete" tone="danger" label={`Delete ${c.code}`} onClick={() => window.confirm(`Delete ${c.code}?`) && run(() => remove(c._id).unwrap(), `${c.code} deleted`)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <nav aria-label="Coupon pages" className="flex items-center gap-4 text-sm">
          <button type="button" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <button type="button" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)} className="underline underline-offset-4 disabled:no-underline disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
