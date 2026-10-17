import { notifyOrder } from "./order-email.service";
import type Stripe from "stripe";
import { env } from "../config/env";
import { requireStripe, stripe } from "../config/stripe";
import { Order } from "../models/Order";
import { ApiError } from "../utils/ApiError";

const toMinorUnits = (amount: number): number => Math.round(amount * 100);

/** Creates (or re-uses) the Stripe PaymentIntent for an unpaid card order and returns the secret the browser needs to pay. */
export async function createOrGetPaymentIntent(userId: string, orderId: string): Promise<{ clientSecret: string }> {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.paymentMethod !== "stripe") throw ApiError.badRequest("This order is not a card payment order");
  if (order.orderStatus === "cancelled") throw ApiError.conflict("This order was cancelled");
  if (order.paymentStatus === "paid") throw ApiError.conflict("This order is already paid");

  const client = requireStripe();
  if (order.stripePaymentIntentId) {
    const existing = await client.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (existing.status !== "canceled" && existing.client_secret) return { clientSecret: existing.client_secret };
  }

  // The amount comes from the saved order, never from the browser
  const intent = await client.paymentIntents.create(
    {
      amount: toMinorUnits(order.total),
      currency: env.STRIPE_CURRENCY,
      automatic_payment_methods: { enabled: true },
      description: `Order ${order.orderNumber}`,
      metadata: { orderId: order.id as string, orderNumber: order.orderNumber },
    },
    { idempotencyKey: `order-${order.id}-${order.stripePaymentIntentId ?? "first"}` }, // a double click never makes two intents
  );
  if (!intent.client_secret) throw new ApiError(502, "Payment service error. Please try again.");
  await Order.updateOne({ _id: order._id }, { stripePaymentIntentId: intent.id });
  return { clientSecret: intent.client_secret };
}

/** Best effort: stops a payment that can no longer succeed (the order was cancelled or expired). */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<void> {
  if (!stripe) return;
  await stripe.paymentIntents.cancel(paymentIntentId).catch((e: unknown) => console.error(`Could not cancel payment ${paymentIntentId}:`, e));
}

export async function refund(paymentIntentId: string): Promise<void> {
  await requireStripe().refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `refund-${paymentIntentId}` });
}

async function onPaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  const orderId = intent.metadata.orderId;
  if (!orderId) return; // not one of our payments
  const order = await Order.findOne({ _id: orderId, stripePaymentIntentId: intent.id });
  if (!order) return void console.error(`Payment ${intent.id} succeeded but no matching order was found`);
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return; // duplicate delivery of the same event

  if (intent.amount_received !== toMinorUnits(order.total) || intent.currency !== env.STRIPE_CURRENCY) {
    return void console.error(`Payment ${intent.id} for order ${order.orderNumber} does not match the order total. Not marked as paid; check it in Stripe.`);
  }

  // Only a pending, unpaid order can be confirmed. One atomic update decides the race with a cancellation.
  const confirmed = await Order.updateOne(
    { _id: order._id, orderStatus: "pending", paymentStatus: { $ne: "paid" } },
    { $set: { paymentStatus: "paid", orderStatus: "confirmed" }, $push: { statusHistory: { status: "confirmed", note: "Payment received", changedAt: new Date() } } },
  );
  if (confirmed.modifiedCount === 1) return void notifyOrder(order._id, { kind: "confirmation" });

  // The order was cancelled or expired just before the money arrived: give the money back
  const latest = await Order.findById(order._id);
  if (latest?.orderStatus === "cancelled") {
    await refund(intent.id);
    await Order.updateOne({ _id: order._id }, { paymentStatus: "refunded" });
  }
}

async function onPaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
  await Order.updateOne({ stripePaymentIntentId: intent.id, paymentStatus: "pending" }, { paymentStatus: "failed" });
}

/** Called only with events whose signature was verified. Safe to receive the same event twice. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "payment_intent.succeeded") await onPaymentSucceeded(event.data.object);
  else if (event.type === "payment_intent.payment_failed") await onPaymentFailed(event.data.object);
}
