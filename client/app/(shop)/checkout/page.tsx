import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutFlow />
    </AuthGuard>
  );
}
