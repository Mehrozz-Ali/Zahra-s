"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AddressStep } from "@/components/checkout/AddressStep";
import { CouponBox } from "@/components/checkout/CouponBox";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { DeliveryStep } from "@/components/checkout/DeliveryStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { Stepper } from "@/components/checkout/Stepper";
import { useAuth } from "@/hooks/useAuth";
import { saveGuestOrder } from "@/lib/guestOrder";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { getErrorMessage } from "@/lib/errors";
import { useGetCheckoutQuoteQuery, usePlaceOrderMutation } from "@/services/orderApi";
import { clearCart } from "@/store/slices/cartSlice";
import type { DeliveryMethod, ShippingAddress } from "@/types";

type Step = 1 | 2 | 3 | 4;

export function CheckoutFlow() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  const [step, setStep] = useState<Step>(1);
  const { user, isLoading: authLoading } = useAuth();
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [couponCode, setCouponCode] = useState(""); // the code the customer applied; the server decides if it is valid
  const [error, setError] = useState("");
  const [placeOrder, { isLoading: placing }] = usePlaceOrderMutation();

  const lines = useMemo(() => items.map(({ productId, size, quantity }) => ({ productId, size, quantity })), [items]);
  const { data: quote, isError: quoteFailed, refetch } = useGetCheckoutQuoteQuery({ lines, couponCode: couponCode || undefined }, { skip: lines.length === 0 });

  if (!hydrated || authLoading) return <p role="status" className="p-10 text-center text-stone">Loading checkout...</p>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl">Nothing to check out</h1>
        <p className="mb-8 mt-2 text-stone">Your cart is empty.</p>
        <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Continue shopping</Link>
      </div>
    );
  }

  const selected = quote?.options.find((o) => o.method === deliveryMethod);
  const cartChanged = quote?.items.some((i) => !i.available || i.issue) ?? false;

  const submit = async () => {
    if (!address) return setStep(1);
    setError("");
    try {
      const order = await placeOrder({ lines, shippingAddress: address, deliveryMethod, paymentMethod, couponCode: quote?.coupon?.code, email: user ? undefined : email }).unwrap();
      dispatch(clearCart());
      if (!user) saveGuestOrder(order); // a guest has no account to look the order up in
      router.replace(paymentMethod === "stripe" ? `/checkout/pay/${order._id}` : `/checkout/confirmation/${order._id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-display text-5xl">Checkout</h1>
      <Stepper current={step} />

      {quoteFailed && <p role="alert" className="mb-6 bg-red-50 p-4 text-sm text-red-800">We could not confirm current prices. <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>}
      {cartChanged && <p role="alert" className="mb-6 bg-sand/60 p-4 text-sm">Some items in your cart have changed. <Link href="/cart" className="underline underline-offset-4">Review your cart</Link> before placing your order.</p>}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {step === 1 && <AddressStep initial={address} initialEmail={email} onNext={(a, e) => { setAddress(a); if (e) setEmail(e); setStep(2); }} />}
          {step === 2 && <DeliveryStep options={quote?.options} value={deliveryMethod} onChange={setDeliveryMethod} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <PaymentStep cardAllowed={Boolean(user)} value={paymentMethod} onChange={setPaymentMethod} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
          {step === 4 && address && <ReviewStep address={address} paymentMethod={paymentMethod} delivery={selected} total={cartChanged ? undefined : selected?.summary.total} placing={placing} error={error} onEdit={setStep} onBack={() => setStep(3)} onPlace={submit} />}
        </div>
        <CheckoutSummary
          items={quote?.items ?? []}
          summary={selected?.summary}
          coupon={quote?.coupon}
          couponSlot={<CouponBox applied={quote?.coupon ?? null} error={couponCode ? quote?.couponError ?? null : null} onApply={setCouponCode} onRemove={() => setCouponCode("")} />}
        />
      </div>
    </div>
  );
}
