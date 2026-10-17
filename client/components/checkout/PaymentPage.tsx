"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { stripePromise } from "@/lib/stripe";
import { useGetOrderQuery } from "@/services/orderApi";
import { useCreatePaymentIntentMutation } from "@/services/paymentApi";

function PayForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/checkout/confirmation/${orderId}` }, redirect: "if_required" });
    if (result.error) {
      setError(result.error.message ?? "The payment did not go through. Please try again.");
      setBusy(false);
      return;
    }
    router.replace(`/checkout/confirmation/${orderId}`); // the order is marked paid by Stripe's signed webhook, not by this page
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p role="alert" className="bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <Button type="submit" loading={busy} disabled={!stripe || !elements}>Pay {formatPrice(total)}</Button>
    </form>
  );
}

function Content({ id }: { id: string }) {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetOrderQuery(id);
  const [createIntent] = useCreatePaymentIntentMutation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const requested = useRef(false);

  const payable = Boolean(order && order.paymentMethod === "stripe" && order.paymentStatus !== "paid" && order.orderStatus !== "cancelled");

  useEffect(() => {
    if (order?.paymentStatus === "paid") router.replace(`/checkout/confirmation/${id}`);
  }, [order?.paymentStatus, id, router]);

  useEffect(() => {
    if (!payable || requested.current) return;
    requested.current = true; // the server also guards against duplicates, this just avoids a second request
    createIntent(id).unwrap().then((r) => setClientSecret(r.clientSecret)).catch((e) => setError(getErrorMessage(e)));
  }, [payable, id, createIntent]);

  const box = "mx-auto max-w-xl px-6 py-24 text-center";
  if (isLoading) return <p role="status" className="p-10 text-center text-stone">Loading your order...</p>;
  if (isError || !order) return <div className={box}><h1 className="font-display text-5xl">Order not found</h1><Link href="/account/orders" className="mt-6 inline-block underline underline-offset-4">My orders</Link></div>;
  if (order.orderStatus === "cancelled") return <div className={box}><h1 className="font-display text-5xl">Order cancelled</h1><p className="mb-6 mt-2 text-stone">This order was cancelled, for example because payment was not completed in time.</p><Link href="/shop" className="underline underline-offset-4">Continue shopping</Link></div>;
  if (!payable) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl">Pay for your order</h1>
      <p className="mb-8 mt-2 text-stone">Order {order.orderNumber} &middot; <strong className="text-ink">{formatPrice(order.total)}</strong>. Please complete payment within 30 minutes or the order is cancelled.</p>
      {error && <p role="alert" className="mb-4 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {!stripePromise ? (
        <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">Card payments are not set up on this site yet.</p>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#8e5468", borderRadius: "0px" } } }}>
          <PayForm orderId={order._id} total={order.total} />
        </Elements>
      ) : !error ? (
        <p role="status" className="text-stone">Preparing secure payment...</p>
      ) : null}
    </div>
  );
}

export function PaymentPage({ id }: { id: string }) {
  return <AuthGuard><Content id={id} /></AuthGuard>;
}
