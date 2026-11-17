"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { OrderStatusSelect } from "@/components/admin/orders/OrderStatusSelect";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useBookPostexMutation, useGetAdminOrderQuery, useUpdateOrderStatusMutation } from "@/services/adminApi";
import type { OrderStatus } from "@/types";

const ACTION: Record<OrderStatus, { label: string; confirm?: string }> = {
  pending: { label: "Back to pending" },
  confirmed: { label: "Confirm order" },
  processing: { label: "Start processing" },
  shipped: { label: "Mark as shipped" },
  delivered: { label: "Mark as delivered" },
  cancelled: { label: "Cancel order", confirm: "Cancel this order? The stock goes back to the store, and a paid card payment is refunded automatically. This cannot be undone." },
};
const when = (iso: string) => new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function OrderDetail({ id }: { id: string }) {
  const { data, isLoading, error, refetch } = useGetAdminOrderQuery(id, { refetchOnMountOrArgChange: true });
  const [update, { isLoading: saving }] = useUpdateOrderStatusMutation();
  const [bookPostex, { isLoading: booking }] = useBookPostexMutation();
  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<OrderStatus | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <div role="status" aria-label="Loading order" className="h-96 animate-pulse bg-sand/60 motion-reduce:animate-none" />;
  if (error || !data) {
    const missing = typeof error === "object" && error !== null && "status" in error && error.status === 404;
    return <p role="alert" className="bg-red-50 p-5 text-red-800">{missing ? "This order does not exist." : getErrorMessage(error, "The order could not be loaded.")} {missing ? <Link href="/admin/orders" className="ml-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink">Back to orders</Link> : <button type="button" onClick={() => refetch()} className="ml-2 inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink">Try again</button>}</p>;
  }

  const { order, allowedTransitions, waitingForPayment, postexEnabled } = data;
  const canBook = postexEnabled && !order.shipment && (order.orderStatus === "confirmed" || order.orderStatus === "processing") && !waitingForPayment;
  const a = order.shippingAddress;

  const move = async (status: OrderStatus) => {
    const confirmText = ACTION[status].confirm;
    if (confirmText && !window.confirm(confirmText)) return;
    setMessage(null);
    try {
      const result = await update({ id, status, note: note.trim() || undefined }).unwrap();
      setNote("");
      setChoice(null);
      setMessage({ ok: !result.refundFailed, text: result.message });
    } catch (e) {
      setMessage({ ok: false, text: getErrorMessage(e) });
    }
  };

  const book = async () => {
    if (!window.confirm(`Book ${order.orderNumber} with PostEx? ${order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? `The courier will collect ${formatPrice(order.total)} from the customer.` : "No cash will be collected."}`)) return;
    setMessage(null);
    try {
      const result = await bookPostex(id).unwrap();
      setMessage({ ok: true, text: result.message });
    } catch (e) {
      setMessage({ ok: false, text: getErrorMessage(e) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap border border-ink px-4 text-sm transition-colors hover:bg-ink hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink">&larr; All orders</Link>
          <h1 className="mt-1 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">{order.orderNumber}</h1>
          <p className="text-sm text-stone">Placed {when(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3"><PaymentBadge method={order.paymentMethod} status={order.paymentStatus} /><StatusBadge status={order.orderStatus} /></div>
      </div>

      {message && <p role={message.ok ? "status" : "alert"} className={clsx("p-3 text-sm", message.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-800")}>{message.text}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="items-h" className="border border-sand bg-white p-5">
            <h2 id="items-h" className="mb-3 font-sans text-lg font-semibold">Items to pack</h2>
            <ul className="divide-y divide-sand/60">
              {order.items.map((i) => (
                <li key={`${i.product}|${i.size}`} className="flex gap-4 py-3 text-sm">
                  <span className="relative block h-20 w-16 shrink-0 overflow-hidden bg-sand">{i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.slug}`} target="_blank" className="font-medium hover:text-rose-dark">{i.name}</Link>
                    <p className="text-stone">SKU {i.sku}</p>
                    <p>Size <span className="font-medium">{i.size}</span></p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums"><p>{formatPrice(i.price)} &times; {i.quantity}</p><p className="font-medium">{formatPrice(i.price * i.quantity)}</p></div>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-sand pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-stone">Discount{order.coupon ? ` (${order.coupon.code})` : ""}</dt><dd className="tabular-nums text-green-800">-{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone">Shipping ({order.deliveryMethod})</dt><dd className="tabular-nums">{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd></div>
              {order.tax > 0 && <div className="flex justify-between"><dt className="text-stone">Tax</dt><dd className="tabular-nums">{formatPrice(order.tax)}</dd></div>}
              <div className="flex justify-between pt-1 text-lg font-medium"><dt>Total{order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? " to collect" : ""}</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="hist-h" className="border border-sand bg-white p-5">
            <h2 id="hist-h" className="mb-3 font-sans text-lg font-semibold">History</h2>
            <ol className="space-y-3 text-sm">
              {[...order.statusHistory].reverse().map((h, idx) => (
                <li key={idx} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-dark" aria-hidden /><div><p><StatusBadge status={h.status} /> <span className="ml-1 text-xs text-stone">{when(h.changedAt)}</span></p>{h.note && <p className="mt-0.5 text-stone">{h.note}</p>}</div></li>
              ))}
            </ol>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section aria-labelledby="act-h" className="border border-sand bg-white p-5">
            <h2 id="act-h" className="mb-3 font-sans text-lg font-semibold">Update status</h2>
            {allowedTransitions.length === 0 ? (
              <p className="text-sm text-stone">{order.orderStatus === "delivered" ? "This order has been delivered. Nothing more to do." : "This order was cancelled. Nothing more to do."}</p>
            ) : (
              <div className="space-y-3">
                {waitingForPayment && <p className="bg-amber-50 p-3 text-sm text-amber-900">Waiting for the customer to pay by card. It can only be cancelled until payment arrives.</p>}
                <div className="space-y-1.5">
                  <label htmlFor="status-note" className="block text-sm">Note (optional, saved in the history)</label>
                  <p id="status-note-hint" className="text-xs text-stone">The customer is emailed when you ship or cancel, and your note is included in that email, so write it for them. Keep internal remarks out.</p>
                  <textarea id="status-note" aria-describedby="status-note-hint" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-sand bg-white p-2 text-sm outline-none focus:border-rose-dark" placeholder="e.g. TCS tracking 123456" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="status-select" className="block text-sm">Move this order to</label>
                  <OrderStatusSelect id="status-select" label="New order status" current={order.orderStatus} next={allowedTransitions} value={choice ?? order.orderStatus} onChange={setChoice} disabled={saving} />
                </div>
                <button type="button" disabled={saving || !choice || choice === order.orderStatus} onClick={() => choice && move(choice)}
                  className={clsx("h-11 w-full px-4 text-sm uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50", choice === "cancelled" ? "border border-red-800 text-red-800 hover:bg-red-50" : "bg-ink text-ivory hover:bg-rose-dark")}>
                  {saving ? "Please wait..." : choice === "cancelled" ? "Cancel order" : "Update status"}
                </button>
              </div>
            )}
          </section>

          {(order.shipment || postexEnabled) && (
            <section aria-labelledby="courier-h" className="border border-sand bg-white p-5 text-sm">
              <h2 id="courier-h" className="mb-3 font-sans text-lg font-semibold">Courier</h2>
              {order.shipment ? (
                <>
                  <p>Booked with <span className="font-medium">PostEx</span> on {when(order.shipment.bookedAt)}.</p>
                  <p className="mt-1 text-stone">Tracking number</p>
                  <p className="select-all font-medium tabular-nums">{order.shipment.trackingNumber}</p>
                  <p className="mt-2 text-xs text-stone">Customers see this number on their order page and in the shipped email. Mark the order as shipped when the parcel is handed over.</p>
                </>
              ) : canBook ? (
                <>
                  <p className="mb-3 text-stone">Send this order to PostEx and save the tracking number.</p>
                  <button type="button" onClick={book} disabled={booking} className="h-11 w-full bg-ink px-4 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark disabled:cursor-not-allowed disabled:opacity-50">{booking ? "Booking..." : "Book with PostEx"}</button>
                </>
              ) : (
                <p className="text-stone">{order.orderStatus === "delivered" || order.orderStatus === "cancelled" || order.orderStatus === "shipped" ? "This order can no longer be booked here." : "Confirm the order first, then it can be booked with PostEx."}</p>
              )}
            </section>
          )}

          <section aria-labelledby="cust-h" className="border border-sand bg-white p-5 text-sm">
            <h2 id="cust-h" className="mb-3 font-sans text-lg font-semibold">Customer</h2>
            {order.user ? (
              <>
                <p className="font-medium"><Link href={`/admin/customers/${order.user._id}`} className="hover:text-rose-dark">{order.user.name}</Link></p>
                <p><a href={`mailto:${order.user.email}`} className="underline underline-offset-4">{order.user.email}</a></p>
              </>
            ) : order.contactEmail ? (
              <>
                <p className="font-medium">{order.shippingAddress.fullName} <span className="ml-1 rounded-sm bg-sand px-1.5 py-0.5 text-xs font-normal uppercase tracking-wider text-stone">Guest</span></p>
                <p><a href={`mailto:${order.contactEmail}`} className="break-all underline underline-offset-4">{order.contactEmail}</a></p>
                <p className="mt-1 text-stone">Ordered without an account.</p>
              </>
            ) : <p className="text-stone">This customer account no longer exists.</p>}
          </section>

          <section aria-labelledby="ship-h" className="border border-sand bg-white p-5 text-sm">
            <h2 id="ship-h" className="mb-3 font-sans text-lg font-semibold">Ship to</h2>
            <address className="not-italic leading-relaxed">
              <p className="font-medium">{a.fullName}</p>
              <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
              <p>{a.city}, {a.province}{a.postalCode ? ` ${a.postalCode}` : ""}</p>
              <p>{a.country}</p>
              <p className="mt-1"><a href={`tel:${a.phone}`} className="underline underline-offset-4">{a.phone}</a></p>
            </address>
            <p className="mt-3 text-stone">Delivery: {order.deliveryMethod === "express" ? "Express" : "Standard"}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
