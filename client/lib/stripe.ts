import { loadStripe } from "@stripe/stripe-js";

const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/** Only imported by the payment page, so Stripe.js is not loaded anywhere else. */
export const stripePromise = key ? loadStripe(key) : null;
