import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

// Open to guests: no account needed to place a cash-on-delivery order
export default function CheckoutPage() {
  return <CheckoutFlow />;
}
