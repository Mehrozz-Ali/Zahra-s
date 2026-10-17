import { Schema, model } from "mongoose";
import { DISCOUNT_TYPES, type DiscountType } from "../types";

export interface ICoupon {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit?: number; // undefined = unlimited
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, match: [/^[A-Z0-9_-]{3,30}$/, "Code must be 3-30 letters, numbers, - or _"] },
    discountType: { type: String, enum: DISCOUNT_TYPES, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

couponSchema.pre("validate", function () {
  if (this.discountType === "percentage" && this.discountValue > 100) this.invalidate("discountValue", "Percentage discount cannot exceed 100");
  if (this.expiryDate <= this.startDate) this.invalidate("expiryDate", "Expiry date must be after the start date");
});

export const Coupon = model<ICoupon>("Coupon", couponSchema);
