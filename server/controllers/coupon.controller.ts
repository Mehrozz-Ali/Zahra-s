import * as couponService from "../services/coupon.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { CouponListQuery, CreateCouponInput, UpdateCouponInput } from "../validations/coupon.validation";

export const listCoupons = asyncHandler(async (req, res) => {
  sendSuccess(res, await couponService.listCoupons(req.query as unknown as CouponListQuery), "Coupons fetched successfully");
});
export const createCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { coupon: await couponService.createCoupon(req.body as CreateCouponInput) }, "Coupon created", 201);
});
export const updateCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { coupon: await couponService.updateCoupon(String(req.params.id), req.body as UpdateCouponInput) }, "Coupon updated");
});
export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(String(req.params.id));
  sendSuccess(res, null, "Coupon deleted");
});
