import Stripe from "stripe";
import { env } from "./env";
import { ApiError } from "../utils/ApiError";

export const isStripeConfigured = Boolean(env.STRIPE_SECRET_KEY);
export const stripe = isStripeConfigured ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export function requireStripe(): Stripe {
  if (!stripe) throw new ApiError(503, "Card payments are not set up yet. Please choose cash on delivery.");
  return stripe;
}
