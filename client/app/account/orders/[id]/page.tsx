import type { Metadata } from "next";
import { OrderDetail } from "@/components/account/OrderDetail";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderDetail id={(await params).id} />;
}
