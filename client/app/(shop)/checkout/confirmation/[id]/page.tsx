import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderConfirmation id={(await params).id} />;
}
