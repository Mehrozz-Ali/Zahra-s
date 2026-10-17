import { Router } from "express";
import {
  adminDeleteReview, createReview, deleteMyReview, getMyReviewState, listAdminReviews, listLatestReviews, listProductReviews, updateReview,
} from "../controllers/review.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";
import {
  adminReviewsQuerySchema, createReviewSchema, latestReviewsQuerySchema, productReviewsQuerySchema, reviewProductParamSchema, updateReviewSchema,
} from "../validations/review.validation";

const router = Router();

// Public
router.get("/latest", validate({ query: latestReviewsQuerySchema }), listLatestReviews);
router.get("/product/:productId", validate({ params: reviewProductParamSchema, query: productReviewsQuerySchema }), listProductReviews);

// Admin (above "/:id")
router.get("/admin/all", protect, adminOnly, validate({ query: adminReviewsQuerySchema }), listAdminReviews);
router.delete("/admin/:id", protect, adminOnly, validate({ params: idParamSchema }), adminDeleteReview);

// Customer
router.get("/product/:productId/mine", protect, validate({ params: reviewProductParamSchema }), getMyReviewState);
router.post("/", protect, authLimiter, validate({ body: createReviewSchema }), createReview);
router.patch("/:id", protect, validate({ params: idParamSchema, body: updateReviewSchema }), updateReview);
router.delete("/:id", protect, validate({ params: idParamSchema }), deleteMyReview);

export default router;
