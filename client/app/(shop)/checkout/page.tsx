import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Open to guests: no account needed to place a cash-on-delivery order
export default function CheckoutPage() {
  return <Suspense fallback={<p role="status" className="p-10 text-center text-stone">Loading checkout...</p>}><CheckoutFlow /></Suspense>;
}
