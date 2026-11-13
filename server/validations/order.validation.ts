import { z } from "zod";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "../types";
import { cartLine } from "./cart.validation";
import { couponCodeOptional } from "./coupon.validation";
import { addressSchema } from "./user.validation";

const lines = z.array(cartLine).min(1, "Your cart is empty").max(50);

export const quoteSchema = z.object({ lines, couponCode: couponCodeOptional });

export const placeOrderSchema = z.object({
  lines,
  shippingAddress: addressSchema.omit({ isDefault: true }),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  couponCode: couponCodeOptional,
  /** Required for guests (no account), ignored when logged in */
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120).optional(),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(5).max(30),
  phone: z.string().trim().min(7).max(20),
});
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

export type QuoteInput = z.infer<typeof quoteSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
