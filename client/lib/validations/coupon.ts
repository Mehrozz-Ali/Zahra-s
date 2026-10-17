import { z } from "zod";

// Keep these rules in sync with server/validations/coupon.validation.ts
// The form holds everything as text or numbers the inputs can give; toCouponPayload() converts it for the API.
export const couponFormSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3-30 letters, numbers, - or _"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number({ message: "Enter a number" }).positive("Must be more than 0"),
  minimumOrderAmount: z.coerce.number({ message: "Enter a number" }).min(0, "Cannot be negative"),
  maximumDiscount: z.string().trim().refine((v) => v === "" || Number(v) > 0, "Must be more than 0"),
  startDate: z.string().min(1, "Choose a start date"),
  expiryDate: z.string().min(1, "Choose an expiry date"),
  usageLimit: z.string().trim().refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1), "Whole number, 1 or more"),
  isActive: z.boolean(),
}).superRefine((v, ctx) => {
  if (v.discountType === "percentage" && v.discountValue > 100) ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Cannot exceed 100%" });
  if (v.startDate && v.expiryDate && new Date(v.expiryDate) <= new Date(v.startDate)) ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "Must be after the start date" });
});

export type CouponFormInput = z.input<typeof couponFormSchema>;
export type CouponFormOutput = z.output<typeof couponFormSchema>;

/** What the API receives. Empty optional limits are sent as null so editing can clear them. */
export interface CouponFormValues {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit: number | null;
  isActive: boolean;
}

export const toCouponPayload = (v: CouponFormOutput): CouponFormValues => ({
  code: v.code,
  discountType: v.discountType,
  discountValue: v.discountValue,
  minimumOrderAmount: v.minimumOrderAmount,
  maximumDiscount: v.maximumDiscount === "" ? null : Number(v.maximumDiscount),
  startDate: new Date(v.startDate).toISOString(),
  expiryDate: new Date(v.expiryDate).toISOString(),
  usageLimit: v.usageLimit === "" ? null : Number(v.usageLimit),
  isActive: v.isActive,
});
