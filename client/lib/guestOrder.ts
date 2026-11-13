import type { Order } from "@/types";

/**
 * A guest has no account to look an order up in, so the order we just placed is kept in this browser tab
 * (sessionStorage) for the confirmation page. After that they use "Track order" with the order number and phone.
 */
const key = (id: string) => `guest-order:${id}`;

export function saveGuestOrder(order: Order): void {
  try { sessionStorage.setItem(key(order._id), JSON.stringify(order)); } catch { /* storage blocked: the confirmation page falls back to Track order */ }
}

export function readGuestOrder(id: string): Order | null {
  try {
    const raw = sessionStorage.getItem(key(id));
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch { return null; }
}
