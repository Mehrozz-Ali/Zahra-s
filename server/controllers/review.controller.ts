import { getAuthUser } from "../middleware/auth";
import * as reviewService from "../services/review.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { AdminReviewsQuery, CreateReviewInput, LatestReviewsQuery, ProductReviewsQuery, UpdateReviewInput } from "../validations/review.validation";

export const listProductReviews = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.listProductReviews(String(req.params.productId), req.query as unknown as ProductReviewsQuery), "Reviews fetched successfully");
});

export const listLatestReviews = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.listLatestReviews(req.query as unknown as LatestReviewsQuery), "Reviews fetched successfully");
});

export const getMyReviewState = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.getMyReviewState(getAuthUser(req).id, String(req.params.productId)), "Review status fetched successfully");
});

export const createReview = asyncHandler(async (req, res) => {
  sendSuccess(res, { review: await reviewService.createReview(getAuthUser(req).id, req.body as CreateReviewInput) }, "Thank you for your review", 201);
});

export const updateReview = asyncHandler(async (req, res) => {
  sendSuccess(res, { review: await reviewService.updateReview(getAuthUser(req).id, String(req.params.id), req.body as UpdateReviewInput) }, "Review updated");
});

export const deleteMyReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(String(req.params.id), getAuthUser(req).id);
  sendSuccess(res, null, "Review deleted");
});

export const listAdminReviews = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.listAdminReviews(req.query as unknown as AdminReviewsQuery), "Reviews fetched successfully");
});

export const adminDeleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(String(req.params.id));
  sendSuccess(res, null, "Review deleted");
});
