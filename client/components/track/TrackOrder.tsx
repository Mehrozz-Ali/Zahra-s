"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useTrackOrderMutation } from "@/services/orderApi";
import type { Order } from "@/types";

function Form() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [track, { isLoading }] = useTrackOrderMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderNumber.trim() || !phone.trim()) return setError("Enter your order number and the phone number you used at checkout.");
    try { setOrder(await track({ orderNumber: orderNumber.trim(), phone: phone.trim() }).unwrap()); } catch (err) { setError(getErrorMessage(err)); }
  };

  const card = "border border-sand bg-white p-5 sm:p-6";
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl sm:text-5xl">Track your order</h1>
      <p className="mb-6 mt-2 text-stone">No account needed. Enter your order number (like ORD-20261113-AB12) and the phone number you gave at checkout.</p>

      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Order number" autoCapitalize="characters" autoComplete="off" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
        <FormField label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="03001234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {error && <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <Button type="submit" loading={isLoading} className="sm:w-auto">Track order</Button>
      </form>

      {order && (
        <div className="mt-10 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">{order.orderNumber}</h2><p className="text-stone">Placed {formatDate(order.createdAt)}</p></div>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <section aria-labelledby="t-progress" className={card}>
            <h3 id="t-progress" className="mb-4 font-display text-2xl">Order progress</h3>
            <OrderTimeline order={order} />
            {order.orderStatus === "pending" && <p className="mt-2 border-t border-sand pt-4 text-sm text-stone">Need to change or cancel this order? <Link href="/contact" className="underline underline-offset-4">Contact us</Link> before it is confirmed.</p>}
          </section>
          <section aria-labelledby="t-items" className={card}>
            <h3 id="t-items" className="mb-4 font-display text-2xl">Items</h3>
            <ul className="divide-y divide-sand text-sm">
              {order.items.map((i) => (
                <li key={`${i.product}|${i.size}`} className="flex justify-between gap-4 py-3">
                  <span>{i.name}<span className="block text-stone">Size {i.size} &times; {i.quantity}</span></span>
                  <span className="shrink-0">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-sand pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd></div>
              <div className="flex justify-between pt-2 text-lg font-medium"><dt>{order.paymentMethod === "cod" ? "Pay on delivery" : "Total"}</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>
          <section aria-labelledby="t-ship" className={`${card} text-sm`}>
            <h3 id="t-ship" className="mb-2 font-display text-2xl">Delivering to</h3>
            <p className="leading-relaxed text-stone">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />{order.shippingAddress.city}, {order.shippingAddress.province}</p>
          </section>
        </div>
      )}
    </div>
  );
}

export function TrackOrder() {
  return <Suspense fallback={<p role="status" className="p-10 text-center text-stone">Loading...</p>}><Form /></Suspense>;
}
