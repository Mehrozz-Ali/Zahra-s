import { z } from "zod";
import { objectId } from "./common";

const rating = z.number().int("Rating must be a whole number").min(1, "Choose a rating").max(5);
const comment = z.string().trim().min(5, "Please write at least 5 characters").max(1000, "Reviews can be up to 1000 characters");

export const createReviewSchema = z.object({ productId: objectId, rating, comment });
export const updateReviewSchema = z.object({ rating: rating.optional(), comment: comment.optional() })
  .refine((v) => v.rating !== undefined || v.comment !== undefined, "Nothing to update");

export const productReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const adminReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  q: z.string().trim().max(100).optional(),
});

export const latestReviewsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(12).default(6) });

export const reviewProductParamSchema = z.object({ productId: objectId });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ProductReviewsQuery = z.infer<typeof productReviewsQuerySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;
export type LatestReviewsQuery = z.infer<typeof latestReviewsQuerySchema>;
