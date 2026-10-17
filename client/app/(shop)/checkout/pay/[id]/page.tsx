import type { Metadata } from "next";
import { PaymentPage } from "@/components/checkout/PaymentPage";

export const metadata: Metadata = { title: "Pay for your order", robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  return <PaymentPage id={(await params).id} />;
}
