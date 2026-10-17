import type { Metadata } from "next";
import { OrderList } from "@/components/account/OrderList";

export const metadata: Metadata = { title: "My orders" };

export default function OrdersPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">My orders</h1>
      <OrderList />
    </div>
  );
}
