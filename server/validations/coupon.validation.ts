import { z } from "zod";
import { DISCOUNT_TYPES } from "../types";

/** Codes are case-insensitive for customers and stored in capitals. */
export const couponCodeField = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code must be 3-30 letters, numbers, - or _");

const base = z.object({
  code: couponCodeField,
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().positive("Discount must be more than 0"),
  minimumOrderAmount: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().nullish().transform((v) => v ?? undefined),
  startDate: z.coerce.date().default(() => new Date()),
  expiryDate: z.coerce.date(),
  usageLimit: z.number().int().min(1).nullish().transform((v) => v ?? undefined),
  isActive: z.boolean().default(true),
});


export const createCouponSchema = base
  .refine((v) => v.discountType !== "percentage" || v.discountValue <= 100, { path: ["discountValue"], message: "Percentage discount cannot exceed 100" })
  .refine((v) => v.expiryDate > v.startDate, { path: ["expiryDate"], message: "Expiry date must be after the start date" });

// null clears an optional limit
export const updateCouponSchema = z.object({
  code: couponCodeField.optional(),
  discountType: z.enum(DISCOUNT_TYPES).optional(),
  discountValue: z.number().positive().optional(),
  minimumOrderAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().positive().nullable().optional(),
  startDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, "Nothing to update");

export const couponListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(30).optional(),
  status: z.enum(["all", "active", "inactive", "expired", "scheduled"]).default("all"),
});

export const couponCodeOptional = z.string().trim().max(30).optional().transform((v) => v || undefined);

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CouponListQuery = z.infer<typeof couponListQuerySchema>;
