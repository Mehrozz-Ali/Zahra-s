"use client";

import clsx from "clsx";
import type { OrderStatus } from "@/types";

/** Friendly names for the dropdown. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing (being packed)",
  shipped: "Shipped (dispatched)",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The same rules the server enforces, so the list can offer only the moves that are allowed. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

interface OrderStatusSelectProps {
  id: string;
  current: OrderStatus;
  /** The statuses this order may move to. */
  next: OrderStatus[];
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}

/** A dropdown with the current status and the statuses the admin can move this order to. */
export function OrderStatusSelect({ id, current, next, value, onChange, disabled, label, className }: OrderStatusSelectProps) {
  const options = [current, ...next.filter((s) => s !== current)];
  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled || next.length === 0}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className={clsx("h-11 w-full border border-sand bg-white px-3 text-sm outline-none focus:border-rose-dark disabled:cursor-not-allowed disabled:bg-sand/40 disabled:text-stone", className)}
      >
        {options.map((s) => <option key={s} value={s}>{s === current ? `${STATUS_LABEL[s]} (current)` : STATUS_LABEL[s]}</option>)}
      </select>
    </>
  );
}
