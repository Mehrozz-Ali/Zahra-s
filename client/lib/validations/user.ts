import { z } from "zod";
import { PROVINCES } from "@/lib/constants";

// Keep these rules in sync with server/validations/user.validation.ts
const pkPhone = z.string().trim().regex(/^(\+92|0)3\d{9}$/, "Use a mobile number like 03001234567");

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.union([pkPhone, z.literal("")]),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the receiver's name").max(80),
  phone: pkPhone,
  line1: z.string().trim().min(5, "Enter house, street and area").max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(2, "Enter a city").max(80),
  province: z.enum(PROVINCES, { message: "Choose a province" }),
  postalCode: z.string().trim().max(10),
  isDefault: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type AddressFormInput = z.infer<typeof addressSchema>;
