import type { RequestHandler } from "express";
import { env } from "../config/env";
import { requireStripe } from "../config/stripe";
import { getAuthUser } from "../middleware/auth";
import * as paymentService from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";

export const createPaymentIntent = asyncHandler(async (req, res) => {
  sendSuccess(res, await paymentService.createOrGetPaymentIntent(getAuthUser(req).id, String(req.params.id)), "Payment ready");
});

/** Needs the raw request body, so app.ts mounts it before express.json(). */
export const stripeWebhook: RequestHandler = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string" || !env.STRIPE_WEBHOOK_SECRET) {
    return void res.status(400).json({ success: false, message: "Webhook is not configured or the signature is missing", errors: [] });
  }
  let event;
  try {
    event = requireStripe().webhooks.constructEvent(req.body as Buffer, signature, env.STRIPE_WEBHOOK_SECRET); // rejects anything Stripe did not sign
  } catch {
    return void res.status(400).json({ success: false, message: "Invalid webhook signature", errors: [] });
  }
  try {
    await paymentService.handleStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    next(error); // a 500 makes Stripe retry later
  }
};
