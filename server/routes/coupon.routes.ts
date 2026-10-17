import { Router } from "express";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from "../controllers/coupon.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { couponListQuerySchema, createCouponSchema, updateCouponSchema } from "../validations/coupon.validation";
import { idParamSchema } from "../validations/common";

// Admin only. Customers apply a code through the checkout quote, which runs the same rules on the server.
const router = Router();
router.use(protect, adminOnly);

router.get("/", validate({ query: couponListQuerySchema }), listCoupons);
router.post("/", validate({ body: createCouponSchema }), createCoupon);
router.patch("/:id", validate({ params: idParamSchema, body: updateCouponSchema }), updateCoupon);
router.delete("/:id", validate({ params: idParamSchema }), deleteCoupon);

export default router;
