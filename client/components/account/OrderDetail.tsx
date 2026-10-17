"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useCancelOrderMutation, useGetOrderQuery } from "@/services/orderApi";

const PAYMENT_STATUS = { pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded" } as const;

export function OrderDetail({ id }: { id: string }) {
  const { data: order, isLoading, isError } = useGetOrderQuery(id);
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [error, setError] = useState("");

  if (isLoading) return <p role="status" className="text-stone">Loading your order...</p>;
  if (isError || !order) return <div><h1 className="font-display text-4xl">Order not found</h1><p className="mt-2 text-stone">We could not find this order on your account.</p><Link href="/account/orders" className="mt-4 inline-block underline underline-offset-4">Back to my orders</Link></div>;

  const canCancel = order.orderStatus === "pending" && order.paymentStatus !== "paid";
  const onCancel = async () => {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setError("");
    try { await cancel(order._id).unwrap(); } catch (e) { setError(getErrorMessage(e)); }
  };
  const card = "border border-sand bg-white p-6";

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm text-stone underline underline-offset-4">All orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="font-display text-4xl">{order.orderNumber}</h1><p className="text-stone">Placed {formatDate(order.createdAt)}</p></div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>

      <section aria-labelledby="progress-heading" className={card}>
        <h2 id="progress-heading" className="mb-4 font-display text-2xl">Order progress</h2>
        <OrderTimeline order={order} />
        {canCancel && (
          <div className="mt-2 border-t border-sand pt-4">
            <p className="mb-3 text-sm text-stone">You can cancel until we confirm your order.</p>
            <button type="button" onClick={onCancel} disabled={cancelling} className="border border-red-800 px-5 py-2 text-sm text-red-800 hover:bg-red-800 hover:text-ivory disabled:opacity-60">{cancelling ? "Cancelling..." : "Cancel order"}</button>
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </section>

      <section aria-labelledby="items-heading" className={card}>
        <h2 id="items-heading" className="mb-4 font-display text-2xl">Items</h2>
        <ul className="divide-y divide-sand">
          {order.items.map((i) => (
            <li key={`${i.product}|${i.size}`} className="flex gap-4 py-4 text-sm">
              <Link href={`/product/${i.slug}`} className="relative block h-24 w-[72px] shrink-0 overflow-hidden bg-sand">{i.image && <Image src={i.image} alt={i.name} fill sizes="72px" className="object-cover" />}</Link>
              <div className="flex-1"><Link href={`/product/${i.slug}`} className="font-medium hover:text-rose-dark">{i.name}</Link><p className="text-stone">Size {i.size}</p><p className="text-stone">{formatPrice(i.price)} &times; {i.quantity}</p></div>
              <p className="font-medium">{formatPrice(i.price * i.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-sand pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt className="text-stone">Discount{order.coupon ? ` (${order.coupon.code})` : ""}</dt><dd className="text-green-800">-{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd></div>
          {order.tax > 0 && <div className="flex justify-between"><dt className="text-stone">Tax</dt><dd>{formatPrice(order.tax)}</dd></div>}
          <div className="flex justify-between pt-2 text-lg font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="ship-heading" className={card}>
          <h2 id="ship-heading" className="mb-2 font-display text-2xl">Delivery address</h2>
          <p className="text-sm leading-relaxed text-stone">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.province}<br />{order.shippingAddress.phone}</p>
          <p className="mt-3 text-sm text-stone">{order.deliveryMethod === "express" ? "Express delivery" : "Standard delivery"}</p>
        </section>
        <section aria-labelledby="pay-heading" className={card}>
          <h2 id="pay-heading" className="mb-2 font-display text-2xl">Payment</h2>
          <p className="text-sm text-stone">{order.paymentMethod === "cod" ? "Cash on delivery" : "Card payment"}<br />Status: {PAYMENT_STATUS[order.paymentStatus]}</p>
          {order.paymentMethod === "cod" && order.paymentStatus !== "paid" && order.orderStatus !== "cancelled" && <p className="mt-3 text-sm">Please pay {formatPrice(order.total)} to the courier on delivery.</p>}
          {order.paymentMethod === "stripe" && order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && order.orderStatus === "pending" && (
            <Link href={`/checkout/pay/${order._id}`} className="mt-3 inline-block bg-ink px-5 py-2 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Complete payment</Link>
          )}
        </section>
      </div>
    </div>
  );
}
