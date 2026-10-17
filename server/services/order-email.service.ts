import { Order } from "../models/Order";
import { User } from "../models/User";
import {
  orderCancelledEmail, orderConfirmationEmail, orderDeliveredEmail, orderShippedEmail,
  type CancelledBy, type OrderEmailData, type RenderedEmail,
} from "../emails/templates";
import { sendEmail, toMessage } from "./email.service";

export type OrderEmailEvent =
  | { kind: "confirmation" }
  | { kind: "shipped"; note?: string }
  | { kind: "delivered" }
  | { kind: "cancelled"; by: CancelledBy; note?: string; refunded?: boolean; refundPending?: boolean };

/**
 * Emails the customer about an order. The order is read fresh so the email always shows its current state.
 * Never throws and is not awaited by callers: a mail problem must not undo or delay the order change that triggered it.
 */
export function notifyOrder(orderId: unknown, event: OrderEmailEvent): void {
  void send(String(orderId), event).catch((error: unknown) => console.error(`Order email "${event.kind}" for ${String(orderId)} failed:`, error));
}

async function send(orderId: string, event: OrderEmailEvent): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order) return;
  const user = await User.findById(order.user).select("name email");
  if (!user) return;

  const data: OrderEmailData = {
    _id: String(order._id), orderNumber: order.orderNumber,
    items: order.items.map((i) => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
    shippingAddress: order.shippingAddress, deliveryMethod: order.deliveryMethod, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
    subtotal: order.subtotal, discount: order.discount, shippingCost: order.shippingCost, tax: order.tax, total: order.total,
    coupon: order.coupon ? { code: order.coupon.code } : undefined,
  };
  const email: RenderedEmail =
    event.kind === "confirmation" ? orderConfirmationEmail(user.name, data)
    : event.kind === "shipped" ? orderShippedEmail(user.name, data, event.note)
    : event.kind === "delivered" ? orderDeliveredEmail(user.name, data)
    : orderCancelledEmail(user.name, data, event);
  await sendEmail(toMessage(user.email, email));
}
