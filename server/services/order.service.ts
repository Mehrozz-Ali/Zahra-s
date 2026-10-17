import { isStripeConfigured } from "../config/stripe";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import type { OrderListQuery, PlaceOrderInput } from "../validations/order.validation";
import { quoteCheckout } from "./cart.service";
import { notifyOrder } from "./order-email.service";
import { redeemCoupon, releaseCoupon } from "./coupon.service";
import { cancelPaymentIntent } from "./payment.service";
import { reserveStock, restoreStock, type StockItem } from "./inventory.service";

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  if (input.paymentMethod === "stripe" && !isStripeConfigured) throw new ApiError(503, "Card payments are not set up yet. Please choose cash on delivery.");
  // Prices and stock come from the database, never from the browser
  const { items, options, coupon, couponError } = await quoteCheckout(input.lines, input.couponCode);
  if (couponError) throw ApiError.badRequest(couponError);
  if (items.some((i) => !i.available || i.issue)) {
    throw ApiError.conflict("Some items in your cart have changed. Please review your cart and try again.");
  }
  const summary = options.find((o) => o.method === input.deliveryMethod)?.summary;
  if (!summary) throw ApiError.badRequest("Choose a delivery method");

  const stockItems: StockItem[] = items.map((i) => ({ productId: i.productId, name: i.name ?? "An item", size: i.size, quantity: i.quantity }));
  await reserveStock(stockItems);

  // Count the coupon use atomically, so the usage limit holds even when orders race for the last use
  if (coupon && !(await redeemCoupon(coupon.code))) {
    await restoreStock(stockItems);
    throw ApiError.badRequest("This coupon has just been fully used or has expired");
  }

  try {
    const order = await Order.create({
      user: userId,
      items: items.map((i) => ({ product: i.productId, name: i.name, slug: i.slug, image: i.image, sku: i.sku, size: i.size, quantity: i.quantity, price: i.unitPrice })),
      shippingAddress: { ...input.shippingAddress, country: "Pakistan" },
      deliveryMethod: input.deliveryMethod,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending", // cash: paid to the courier. Card: set to paid by the verified Stripe webhook, never by the browser
      orderStatus: "pending",
      subtotal: summary.subtotal,
      discount: summary.discount,
      shippingCost: summary.shippingCost,
      tax: summary.tax,
      total: summary.total,
      coupon: coupon ? { code: coupon.code, discountAmount: coupon.discountAmount } : undefined,
    });
    await Cart.updateOne({ user: userId }, { items: [] });
    // Cash orders are final now. Card orders get their confirmation once the payment is verified (see payment.service).
    if (order.paymentMethod === "cod") notifyOrder(order._id, { kind: "confirmation" });
    return order;
  } catch (error) {
    await restoreStock(stockItems); // the order was not saved, so give the stock back
    if (coupon) await releaseCoupon(coupon.code);
    throw error;
  }
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw ApiError.notFound("Order not found");
  return order;
}

export async function listOrdersForUser(userId: string, { page, limit }: OrderListQuery) {
  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
      .select("orderNumber items orderStatus paymentMethod paymentStatus total createdAt"),
    Order.countDocuments({ user: userId }),
  ]);
  return { orders, pagination: buildPaginationMeta(total, { page, limit }) };
}

/**
 * Cancels an order that has not been confirmed yet and gives its stock back.
 * The status change is one atomic update that only matches a pending, unpaid order, so cancelling twice
 * (or cancelling while an admin confirms) can never restore stock twice. Paid orders need a refund, so they are refused here.
 */
export async function cancelOrder(orderId: string, options: { userId?: string; note?: string } = {}) {
  const owner = options.userId ? { user: options.userId } : {};
  const order = await Order.findOneAndUpdate(
    { _id: orderId, ...owner, orderStatus: "pending", paymentStatus: { $ne: "paid" } },
    { $set: { orderStatus: "cancelled" }, $push: { statusHistory: { status: "cancelled", note: options.note ?? "Cancelled by customer", changedAt: new Date() } } },
    { new: true },
  );
  if (!order) {
    const exists = await Order.exists({ _id: orderId, ...owner });
    throw exists ? ApiError.conflict("This order can no longer be cancelled online. Please contact us.") : ApiError.notFound("Order not found");
  }
  if (order.stripePaymentIntentId) await cancelPaymentIntent(order.stripePaymentIntentId); // a cancelled order must not be payable
  if (order.coupon?.code) await releaseCoupon(order.coupon.code).catch((e) => console.error(`Coupon use was not released for ${order.orderNumber}:`, e)); // the cancel above is atomic, so this runs once
  try {
    await restoreStock(order.items.map((i) => ({ productId: String(i.product), name: i.name, size: i.size, quantity: i.quantity })));
    order.inventoryRestored = true;
    await Order.updateOne({ _id: order._id }, { inventoryRestored: true });
  } catch (error) {
    // The order is cancelled either way; inventoryRestored stays false so it can be found and fixed
    console.error(`Stock was not restored for cancelled order ${order.orderNumber}:`, error);
  }
  notifyOrder(order._id, { kind: "cancelled", by: options.userId ? "customer" : "payment-timeout" });
  return order;
}

const CARD_PAYMENT_WINDOW_MINUTES = 30;

/** Card orders that were never paid hold stock. After the payment window they are cancelled and the stock is released. */
export async function expireUnpaidCardOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - CARD_PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const stale = await Order.find({ paymentMethod: "stripe", paymentStatus: { $in: ["pending", "failed"] }, orderStatus: "pending", createdAt: { $lt: cutoff } }).select("_id").limit(50);
  let cancelled = 0;
  for (const { id } of stale) {
    try {
      await cancelOrder(id as string, { note: "Payment was not completed in time" });
      cancelled += 1;
    } catch (error) {
      console.error(`Could not expire order ${String(id)}:`, error);
    }
  }
  return cancelled;
}

/** The order as a customer sees it: without payment-provider ids or internal bookkeeping. Admins read the full order. */
export function toCustomerOrder<T extends { toJSON(): Record<string, unknown> }>(order: T): Record<string, unknown> {
  const { stripePaymentIntentId: _intent, inventoryRestored: _restored, ...visible } = order.toJSON();
  return visible;
}
