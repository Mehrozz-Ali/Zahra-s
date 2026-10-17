import clsx from "clsx";
import { formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const STAGES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];
const LABEL: Record<OrderStatus, string> = { pending: "Order placed", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

/** Vertical progress list built from the order's status history. A cancelled order shows only what happened, ending in "Cancelled". */
export function OrderTimeline({ order }: { order: Pick<Order, "orderStatus" | "statusHistory"> }) {
  const reached = new Map(order.statusHistory.map((e) => [e.status, e.changedAt]));
  const stages = order.orderStatus === "cancelled" ? [...STAGES.filter((s) => reached.has(s)), "cancelled" as const] : STAGES;

  return (
    <ol aria-label="Order progress" className="space-y-0">
      {stages.map((stage, i) => {
        const date = reached.get(stage);
        const done = date !== undefined;
        const current = stage === order.orderStatus;
        const cancelled = stage === "cancelled";
        return (
          <li key={stage} aria-current={current ? "step" : undefined} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full border text-xs", cancelled ? "border-red-800 bg-red-800 text-ivory" : done ? "border-ink bg-ink text-ivory" : "border-sand bg-white text-transparent")}>
                {done && <span aria-hidden>{cancelled ? "\u00d7" : "\u2713"}</span>}
              </span>
              {i < stages.length - 1 && <span aria-hidden className={clsx("w-px flex-1", done ? "bg-ink" : "bg-sand")} style={{ minHeight: 28 }} />}
            </div>
            <div className="pb-5">
              <p className={clsx("text-sm", current ? "font-medium" : done ? "" : "text-stone")}>
                {LABEL[stage]}
                {!done && <span className="sr-only"> (not reached yet)</span>}
              </p>
              {date && <p className="text-xs text-stone">{formatDate(date)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
