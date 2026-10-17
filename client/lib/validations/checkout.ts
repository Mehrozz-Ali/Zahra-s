import { z } from "zod";
import { addressSchema } from "./user";

// The same address rules as the address book, plus "save this address to my account"
export const checkoutAddressSchema = addressSchema.omit({ isDefault: true }).extend({ saveAddress: z.boolean() });
export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;
