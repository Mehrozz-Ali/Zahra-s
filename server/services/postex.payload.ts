import type { IOrder } from "../models/Order";

/**
 * !!! UNVERIFIED !!!  The only part of the PostEx integration that depends on PostEx's exact request format.
 *
 * The public references do not publish the v3 create-order schema, so the field names below follow commonly
 * shared PostEx integration examples and MUST be checked against the official "Merchant API Integration Guide"
 * you get from PostEx before the first real booking. If PostEx uses different names, only this file changes.
 */
export function buildCreateOrderPayload(order: Pick<IOrder, "orderNumber" | "shippingAddress" | "items" | "total" | "paymentMethod" | "paymentStatus">, pickupAddressCode: string) {
  const a = order.shippingAddress;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  // Cash is collected by the courier only when the customer has not already paid
  const cashToCollect = order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? order.total : 0;
  return {
    orderRefNumber: order.orderNumber, // unique reference: also what stops the same order being booked twice
    orderType: "Normal",
    orderDetail: order.items.map((i) => `${i.name} (${i.size}) x ${i.quantity}`).join(", ").slice(0, 250),
    customerName: a.fullName,
    customerPhone: a.phone,
    deliveryAddress: [a.line1, a.line2].filter(Boolean).join(", "),
    cityName: a.city,
    invoicePayment: cashToCollect,
    invoiceDivision: 1,
    items: itemCount,
    transactionNotes: "",
    pickupAddressCode,
  };
}

/** Pulls the tracking number out of PostEx's reply. Also unverified: it looks in the places PostEx replies are known to use. */
export function extractTrackingNumber(body: unknown): string | null {
  const find = (node: unknown, depth = 0): string | null => {
    if (!node || typeof node !== "object" || depth > 3) return null;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (/^tracking(number|no|id)?$/i.test(k) && (typeof v === "string" || typeof v === "number") && String(v).trim()) return String(v).trim();
    }
    for (const v of Object.values(node as Record<string, unknown>)) {
      const hit = find(v, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  return find(body);
}

/** PostEx's own error text, if the reply has one */
export function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  for (const k of ["statusMessage", "message", "error"]) if (typeof b[k] === "string" && b[k]) return b[k] as string;
  return null;
}
