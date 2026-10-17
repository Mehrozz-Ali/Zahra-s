import clsx from "clsx";
import type { Order } from "@/types";

const STYLES: Record<Order["paymentStatus"], string> = {
  pending: "bg-amber-50 text-amber-900", paid: "bg-green-50 text-green-900", failed: "bg-red-50 text-red-900", refunded: "bg-stone/10 text-stone",
};

/** "Cash" or "Card" plus the payment state, spelled out in words. */
export function PaymentBadge({ method, status }: { method: Order["paymentMethod"]; status: Order["paymentStatus"] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-stone">{method === "cod" ? "Cash" : "Card"}</span>
      <span className={clsx("px-2 py-0.5 font-medium capitalize", STYLES[status])}>{status === "pending" && method === "cod" ? "To collect" : status}</span>
    </span>
  );
}
