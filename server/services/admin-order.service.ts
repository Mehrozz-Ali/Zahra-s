import { notifyOrder } from "./order-email.service";
import type { FilterQuery } from "mongoose";
import { Order, type IOrder } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";
import { ORDER_STATUSES, type OrderStatus } from "../types";
import type { AdminOrdersQuery, UpdateOrderStatusInput } from "../validations/admin.validation";
import { releaseCoupon } from "./coupon.service";
import { restoreStock } from "./inventory.service";
import { cancelPaymentIntent, refund } from "./payment.service";

/**
 * The only moves an order can make. Delivered and cancelled are final.
 * An order can be cancelled until it ships; after that it has left the building.
 */
export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

type OrderLike = Pick<IOrder, "orderStatus" | "paymentMethod" | "paymentStatus">;

/** A card order that has not been paid yet must not be fulfilled; the customer can still pay, or it can be cancelled. */
export const waitingForPayment = (o: OrderLike): boolean => o.paymentMethod === "stripe" && o.paymentStatus !== "paid" && o.orderStatus !== "cancelled";

/** The moves available right now for this order (what the admin screen offers as buttons). */
export function allowedTransitions(o: OrderLike): OrderStatus[] {
  const next = TRANSITIONS[o.orderStatus];
  return waitingForPayment(o) ? next.filter((s) => s === "cancelled") : [...next];
}

// ---------- Reading ----------

export async function listAdminOrders(q: AdminOrdersQuery) {
  const filter: FilterQuery<IOrder> = {};
  if (q.status) filter.orderStatus = q.status;
  if (q.paymentStatus) filter.paymentStatus = q.paymentStatus;
  if (q.paymentMethod) filter.paymentMethod = q.paymentMethod;
  if (q.from || q.to) filter.createdAt = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ orderNumber: rx }, { "shippingAddress.fullName": rx }, { "shippingAddress.phone": rx }];
  }

  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip((q.page - 1) * q.limit).limit(q.limit)
      .populate("user", "name email phone").select("orderNumber user items shippingAddress orderStatus paymentMethod paymentStatus total createdAt").lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: OrderStatus; count: number }>([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
  ]);
  // How many orders are in each status (for the tabs), regardless of the current filter
  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.count ?? 0]));
  return {
    orders: orders.map((o) => ({ ...o, itemCount: o.items.reduce((n, i) => n + i.quantity, 0), items: undefined })),
    statusCounts,
    pagination: buildPaginationMeta(total, q),
  };
}

export async function getAdminOrder(id: string) {
  const order = await Order.findById(id).populate("user", "name email phone isActive createdAt");
  if (!order) throw ApiError.notFound("Order not found");
  return { order, allowedTransitions: allowedTransitions(order), waitingForPayment: waitingForPayment(order) };
}

// ---------- Changing status ----------

/**
 * Moves an order to a new status. The change is one atomic update that only matches while the order is still
 * in a status that allows the move, so two admins (or an admin and a customer) can never apply conflicting changes.
 */
export async function updateOrderStatus(id: string, { status, note }: UpdateOrderStatusInput) {
  const current = await Order.findById(id);
  if (!current) throw ApiError.notFound("Order not found");
  if (!allowedTransitions(current).includes(status)) {
    if (waitingForPayment(current) && TRANSITIONS[current.orderStatus].includes(status)) {
      throw ApiError.conflict("This card order has not been paid yet, so it cannot be fulfilled. You can cancel it instead.");
    }
    throw ApiError.conflict(`An order that is ${current.orderStatus} cannot be changed to ${status}.`);
  }
  if (status === "cancelled") return cancelAsAdmin(id, note);

  const from = ORDER_STATUSES.filter((s) => TRANSITIONS[s].includes(status));
  const set: Record<string, unknown> = { orderStatus: status };
  // Cash is collected by the courier at the door, so a delivered cash order is a paid order
  if (status === "delivered" && current.paymentMethod === "cod") set.paymentStatus = "paid";

  const updated = await Order.findOneAndUpdate(
    { _id: id, orderStatus: { $in: from } },
    { $set: set, $push: { statusHistory: { status, note, changedAt: new Date() } } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict("This order was just changed by someone else. Reload and try again.");
  if (status === "shipped") notifyOrder(updated._id, { kind: "shipped", note });
  if (status === "delivered") notifyOrder(updated._id, { kind: "delivered" });
  return { order: updated, refundFailed: false };
}

async function cancelAsAdmin(id: string, note?: string) {
  const order = await Order.findOneAndUpdate(
    { _id: id, orderStatus: { $in: ["pending", "confirmed", "processing"] } },
    { $set: { orderStatus: "cancelled" }, $push: { statusHistory: { status: "cancelled", note: note ?? "Cancelled by the store", changedAt: new Date() } } },
    { new: true },
  );
  if (!order) throw ApiError.conflict("This order was just changed by someone else. Reload and try again.");

  let refundFailed = false;
  if (order.stripePaymentIntentId) {
    if (order.paymentStatus === "paid") {
      try {
        await refund(order.stripePaymentIntentId);
        await Order.updateOne({ _id: order._id }, { paymentStatus: "refunded", $push: { statusHistory: { status: "cancelled", note: "Payment refunded", changedAt: new Date() } } });
        order.paymentStatus = "refunded";
      } catch (error) {
        refundFailed = true;
        console.error(`Refund failed for cancelled order ${order.orderNumber}:`, error);
        await Order.updateOne({ _id: order._id }, { $push: { statusHistory: { status: "cancelled", note: "Automatic refund failed. Refund this payment in Stripe.", changedAt: new Date() } } });
      }
    } else {
      await cancelPaymentIntent(order.stripePaymentIntentId); // an unpaid card order must not become payable later
    }
  }

  try {
    await restoreStock(order.items.map((i) => ({ productId: String(i.product), name: i.name, size: i.size, quantity: i.quantity })));
    await Order.updateOne({ _id: order._id }, { inventoryRestored: true });
  } catch (error) {
    console.error(`Stock was not restored for cancelled order ${order.orderNumber}:`, error); // inventoryRestored stays false so it can be found
  }
  if (order.coupon?.code) await releaseCoupon(order.coupon.code).catch((e) => console.error(`Coupon use was not released for ${order.orderNumber}:`, e));

  notifyOrder(order._id, { kind: "cancelled", by: "store", note, refunded: order.paymentStatus === "refunded", refundPending: refundFailed });
  return { order, refundFailed };
}
