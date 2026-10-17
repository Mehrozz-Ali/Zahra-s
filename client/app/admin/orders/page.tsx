import type { Metadata } from "next";
import { OrderManager } from "@/components/admin/orders/OrderManager";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return <OrderManager />;
}
