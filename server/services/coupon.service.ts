import { Coupon, type ICoupon } from "../models/Coupon";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";
import type { CouponListQuery, CreateCouponInput, UpdateCouponInput } from "../validations/coupon.validation";

// ---------- Customer side ----------

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  description: string;
}

/** The discount a coupon gives on a subtotal (whole rupees, never more than the subtotal). */
export function calculateDiscount(coupon: Pick<ICoupon, "discountType" | "discountValue" | "maximumDiscount">, subtotal: number): number {
  const raw = coupon.discountType === "percentage" ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  const capped = coupon.maximumDiscount ? Math.min(raw, coupon.maximumDiscount) : raw;
  return Math.max(0, Math.min(Math.round(capped), subtotal));
}

const describe = (c: Pick<ICoupon, "discountType" | "discountValue">) => (c.discountType === "percentage" ? `${c.discountValue}% off` : `Rs. ${c.discountValue.toLocaleString("en-PK")} off`);

/**
 * Checks a code against the rules and returns the discount. Throws a 400 with a customer-friendly reason.
 * This check is repeated at order time, and redeemCoupon() is what actually enforces the usage limit.
 */
export async function evaluateCoupon(rawCode: string, subtotal: number, now = new Date()) {
  const code = rawCode.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.isActive) throw ApiError.badRequest("This coupon code is not valid");
  if (coupon.startDate > now) throw ApiError.badRequest("This coupon is not active yet");
  if (coupon.expiryDate <= now) throw ApiError.badRequest("This coupon has expired");
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest("This coupon has been fully used");
  if (subtotal < coupon.minimumOrderAmount) throw ApiError.badRequest(`Spend Rs. ${coupon.minimumOrderAmount.toLocaleString("en-PK")} or more to use this coupon`);
  const discountAmount = calculateDiscount(coupon, subtotal);
  if (discountAmount <= 0) throw ApiError.badRequest("This coupon does not apply to your order");
  const applied: AppliedCoupon = { code: coupon.code, discountAmount, description: describe(coupon) };
  return { coupon, applied };
}

/**
 * Counts one use. A single atomic update re-checks every rule, so two orders racing for the last use
 * can never both succeed. Returns false if the coupon can no longer be used.
 */
export async function redeemCoupon(code: string, now = new Date()): Promise<boolean> {
  const updated = await Coupon.findOneAndUpdate(
    {
      code: code.toUpperCase(), isActive: true, startDate: { $lte: now }, expiryDate: { $gt: now },
      $or: [{ usageLimit: { $exists: false } }, { usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
  );
  return Boolean(updated);
}

/** Gives a use back (order failed or was cancelled). Never goes below zero. */
export async function releaseCoupon(code: string): Promise<void> {
  await Coupon.updateOne({ code: code.toUpperCase(), usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

// ---------- Admin ----------

const statusOf = (c: ICoupon, now = new Date()): "active" | "inactive" | "expired" | "scheduled" | "used_up" => {
  if (!c.isActive) return "inactive";
  if (c.expiryDate <= now) return "expired";
  if (c.startDate > now) return "scheduled";
  if (c.usageLimit !== undefined && c.usedCount >= c.usageLimit) return "used_up";
  return "active";
};

const withStatus = (c: InstanceType<typeof Coupon>) => ({ ...c.toObject(), status: statusOf(c) });

export async function listCoupons({ page, limit, q, status }: CouponListQuery) {
  const now = new Date();
  const filter: Record<string, unknown> = {};
  if (q) filter.code = new RegExp(escapeRegex(q.toUpperCase()));
  if (status === "inactive") filter.isActive = false;
  if (status === "expired") Object.assign(filter, { isActive: true, expiryDate: { $lte: now } });
  if (status === "scheduled") Object.assign(filter, { isActive: true, startDate: { $gt: now } });
  if (status === "active") Object.assign(filter, { isActive: true, startDate: { $lte: now }, expiryDate: { $gt: now } });
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Coupon.countDocuments(filter),
  ]);
  return { coupons: coupons.map(withStatus), pagination: buildPaginationMeta(total, { page, limit }) };
}

export async function createCoupon(input: CreateCouponInput) {
  if (await Coupon.exists({ code: input.code })) throw ApiError.conflict("A coupon with this code already exists");
  return withStatus(await Coupon.create(input));
}

export async function updateCoupon(id: string, input: UpdateCouponInput) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  if (input.code && input.code !== coupon.code && (await Coupon.exists({ code: input.code }))) throw ApiError.conflict("A coupon with this code already exists");
  const { maximumDiscount, usageLimit, ...rest } = input;
  coupon.set(rest);
  if (maximumDiscount !== undefined) coupon.maximumDiscount = maximumDiscount ?? undefined;
  if (usageLimit !== undefined) coupon.usageLimit = usageLimit ?? undefined;
  if (coupon.usageLimit !== undefined && coupon.usageLimit < coupon.usedCount) throw ApiError.badRequest(`Usage limit cannot be lower than the ${coupon.usedCount} uses so far`);
  await coupon.save(); // the model re-checks percentage <= 100 and expiry > start
  return withStatus(coupon);
}

/** Coupons that were used stay (orders refer to them), so they are deactivated instead of deleted. */
export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  if (coupon.usedCount > 0) throw ApiError.conflict("This coupon has been used, so it cannot be deleted. Deactivate it instead.");
  await coupon.deleteOne();
}
