"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { formatPrice } from "@/lib/format";
import { useGetOrderQuery } from "@/services/orderApi";

function Content({ id }: { id: string }) {
  const { data: order, isLoading, isError, refetch } = useGetOrderQuery(id);
  const [gaveUp, setGaveUp] = useState(false);

  // A card payment is confirmed by Stripe's webhook a moment after the customer pays, so check again briefly
  const awaitingPayment = order?.paymentMethod === "stripe" && order.paymentStatus === "pending" && order.orderStatus === "pending";
  useEffect(() => {
    if (!awaitingPayment || gaveUp) return;
    const poll = setInterval(() => void refetch(), 2500);
    const stop = setTimeout(() => setGaveUp(true), 60_000);
    return () => { clearInterval(poll); clearTimeout(stop); };
  }, [awaitingPayment, gaveUp, refetch]);

  if (isLoading) return <p role="status" className="p-10 text-center text-stone">Loading your order...</p>;
  if (isError || !order) {
    return <div className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="font-display text-5xl">Order not found</h1><p className="mb-8 mt-2 text-stone">We could not find this order on your account.</p><Link href="/shop" className="underline underline-offset-4">Continue shopping</Link></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-800" aria-hidden />
        <h1 className="mt-4 font-display text-5xl">Thank you for your order</h1>
        <p className="mt-2 text-stone">Order number <strong className="text-ink">{order.orderNumber}</strong></p>
        {order.paymentMethod === "cod" && <p className="mt-1 text-stone">We will call to confirm your order before dispatch.</p>}
        {order.paymentMethod === "stripe" && order.paymentStatus === "paid" && <p role="status" className="mt-1 text-green-800">Payment received. We will prepare your order for dispatch.</p>}
        {awaitingPayment && !gaveUp && <p role="status" className="mt-1 text-stone">Confirming your payment...</p>}
        {awaitingPayment && gaveUp && <p role="status" className="mt-1 text-stone">We have not received confirmation yet. If you were charged, your order will update shortly. Check My orders in a few minutes.</p>}
        {order.paymentMethod === "stripe" && order.paymentStatus === "failed" && (
          <p role="alert" className="mt-1 text-red-800">Your payment did not go through. <Link href={`/checkout/pay/${order._id}`} className="underline underline-offset-4">Try again</Link></p>
        )}
      </div>

      <section aria-labelledby="items-heading" className="mt-10 border border-sand bg-white p-6">
        <h2 id="items-heading" className="mb-4 font-display text-3xl">Items</h2>
        <ul className="divide-y divide-sand text-sm">
          {order.items.map((i) => (
            <li key={`${i.product}|${i.size}`} className="flex justify-between gap-4 py-3">
              <span>{i.name}<span className="block text-stone">Size {i.size} &times; {i.quantity}</span></span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-sand pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd></div>
          <div className="flex justify-between pt-2 text-lg font-medium"><dt>{order.paymentMethod === "cod" ? "Pay on delivery" : order.paymentStatus === "paid" ? "Paid" : "Total"}</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="ship-heading" className="mt-6 border border-sand bg-white p-6 text-sm">
        <h2 id="ship-heading" className="mb-2 font-display text-3xl">Delivering to</h2>
        <p className="leading-relaxed text-stone">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.province}<br />{order.shippingAddress.phone}</p>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/account/orders/${order._id}`} className="bg-ink px-8 py-3.5 text-center text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Track this order</Link>
        <Link href="/shop" className="border border-ink px-8 py-3.5 text-center text-sm uppercase tracking-widest hover:bg-ink hover:text-ivory">Continue shopping</Link>
      </div>
    </div>
  );
}

export function OrderConfirmation({ id }: { id: string }) {
  return <AuthGuard><Content id={id} /></AuthGuard>;
}
