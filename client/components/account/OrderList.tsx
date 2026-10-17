"use client";

import { Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { useGetMyOrdersQuery } from "@/services/orderApi";
import { Eye } from "lucide-react";

export function OrderList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useGetMyOrdersQuery({ page });

  if (isLoading) return <div role="status" aria-label="Loading your orders" className="animate-pulse space-y-4 motion-reduce:animate-none">{[0, 1, 2].map((n) => <div key={n} className="h-32 bg-sand/60" />)}</div>;
  if (isError || !data) return <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">We could not load your orders. <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>;

  if (data.orders.length === 0) {
    return (
      <div className="flex flex-col items-center border border-dashed border-sand py-16 text-center">
        <Package className="h-12 w-12 text-sand" aria-hidden />
        <h2 className="mt-4 font-display text-3xl">No orders yet</h2>
        <p className="mb-6 mt-1 text-stone">When you place an order, you can track it here.</p>
        <Link href="/shop" className="bg-ink px-8 py-3 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Start shopping</Link>
      </div>
    );
  }

  const { pagination } = data;
  return (
    <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <ul className="space-y-4">
        {data.orders.map((o) => {
          const shown = o.items.slice(0, 3);
          const count = o.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <li key={o._id} className="border border-sand bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{o.orderNumber}</p><p className="text-sm text-stone">Placed {formatDate(o.createdAt)} &middot; {count} item{count === 1 ? "" : "s"}</p></div>
                <OrderStatusBadge status={o.orderStatus} />
              </div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {shown.map((i) => <span key={`${i.product}|${i.size}`} className="relative block h-16 w-12 overflow-hidden bg-sand">{i.image && <Image src={i.image} alt={i.name} fill sizes="48px" className="object-cover" />}</span>)}
                  {o.items.length > shown.length && <span className="text-sm text-stone">+{o.items.length - shown.length} more</span>}
                </div>
                <div className="text-right"><p className="font-medium">{formatPrice(o.total)}</p><Link href={`/account/orders/${o._id}`} className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:text-rose-dark"><Eye className="h-4 w-4" aria-hidden />View details</Link></div>
              </div>
            </li>
          );
        })}
      </ul>
      {pagination.totalPages > 1 && (
        <nav aria-label="Orders pagination" className="mt-6 flex items-center justify-between text-sm">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPrev} className="border border-ink px-5 py-2 disabled:opacity-40">Previous</button>
          <span className="text-stone">Page {pagination.page} of {pagination.totalPages}</span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext} className="border border-ink px-5 py-2 disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
