import clsx from "clsx";
import type { OrderStatus } from "@/types";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-900",
  confirmed: "bg-sky-50 text-sky-900",
  processing: "bg-sky-50 text-sky-900",
  shipped: "bg-indigo-50 text-indigo-900",
  delivered: "bg-green-50 text-green-900",
  cancelled: "bg-red-50 text-red-900",
};

/** The status is always spelled out, so colour is never the only signal. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={clsx("inline-block px-2 py-0.5 text-xs font-medium capitalize", STYLES[status])}>{status}</span>;
}
