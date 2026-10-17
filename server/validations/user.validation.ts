import { z } from "zod";
import { PROVINCES } from "../types";
import { optionalText, pkPhone } from "./common";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  phone: z.union([pkPhone, z.literal("")]).optional(), // "" clears the number
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the receiver's name").max(80),
  phone: pkPhone,
  line1: z.string().trim().min(5, "Enter house, street and area").max(200),
  line2: optionalText(200),
  city: z.string().trim().min(2, "Enter a city").max(80),
  province: z.enum(PROVINCES),
  postalCode: optionalText(10),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
