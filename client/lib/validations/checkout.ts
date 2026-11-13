import { z } from "zod";
import { addressSchema } from "./user";

// The same address rules as the address book, plus "save this address to my account"
export const checkoutAddressSchema = addressSchema.omit({ isDefault: true }).extend({ saveAddress: z.boolean(), email: z.string().trim().optional() });
export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;

/** Guests (no account) must also leave an email for their confirmation. */
export const guestCheckoutAddressSchema = checkoutAddressSchema.extend({ email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address") });
