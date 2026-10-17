import clsx from "clsx";
import type { OrderStatus } from "@/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const style: Record<OrderStatus, string> = {
  pending: "bg-sand text-ink",
  confirmed: "bg-rose/30 text-ink",
  processing: "bg-rose/30 text-ink",
  shipped: "bg-ink text-ivory",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={clsx("inline-block px-2.5 py-1 text-xs font-medium uppercase tracking-wider", style[status])}>{STATUS_LABEL[status]}</span>;
}
