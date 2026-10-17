import { Types } from "mongoose";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";
import type { AdminReviewsQuery, CreateReviewInput, LatestReviewsQuery, ProductReviewsQuery, UpdateReviewInput } from "../validations/review.validation";

/** Recomputes the product's average and count from its reviews, so they can never drift. */
async function refreshProductRating(productId: string): Promise<void> {
  const [stats] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: new Types.ObjectId(productId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { rating: stats ? Math.round(stats.avg * 10) / 10 : 0, numReviews: stats?.count ?? 0 });
}

/** The newest delivered order containing the product: this is the proof of purchase. */
const findPurchase = (userId: string, productId: string) =>
  Order.findOne({ user: userId, orderStatus: "delivered", "items.product": productId }).sort({ createdAt: -1 }).select("_id");

export async function listProductReviews(productId: string, { page, limit }: ProductReviewsQuery) {
  const [reviews, total, breakdown] = await Promise.all([
    Review.find({ product: productId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate<{ user: { name: string } }>("user", "name").lean(),
    Review.countDocuments({ product: productId }),
    Review.aggregate<{ _id: number; count: number }>([{ $match: { product: new Types.ObjectId(productId) } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
  ]);
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: breakdown.find((b) => b._id === stars)?.count ?? 0 }));
  return {
    // Only the first name is shown publicly, never the email
    reviews: reviews.map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, authorName: (r.user?.name ?? "Customer").split(" ")[0], createdAt: r.createdAt, updatedAt: r.updatedAt })),
    distribution,
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}

/** Newest 4-5 star reviews for the homepage. Only the first name is public. */
export async function listLatestReviews({ limit }: LatestReviewsQuery) {
  const reviews = await Review.find({ rating: { $gte: 4 } }).sort({ createdAt: -1 }).limit(limit)
    .populate<{ user: { name: string } | null }>("user", "name")
    .populate<{ product: { name: string; slug: string } | null }>("product", "name slug").lean();
  return {
    reviews: reviews
      .filter((r) => r.product)
      .map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, authorName: (r.user?.name ?? "Customer").split(" ")[0], productName: r.product!.name, productSlug: r.product!.slug, createdAt: r.createdAt })),
  };
}

/** What the logged-in customer can do for this product: write, edit, or nothing yet. */
export async function getMyReviewState(userId: string, productId: string) {
  const [review, purchase] = await Promise.all([Review.findOne({ user: userId, product: productId }).lean(), findPurchase(userId, productId)]);
  return { review: review ? { _id: review._id, rating: review.rating, comment: review.comment } : null, canReview: Boolean(purchase) && !review };
}

export async function createReview(userId: string, { productId, rating, comment }: CreateReviewInput) {
  const purchase = await findPurchase(userId, productId);
  if (!purchase) throw ApiError.forbidden("You can review an item after your order containing it has been delivered");
  if (await Review.exists({ user: userId, product: productId })) throw ApiError.conflict("You have already reviewed this item. You can edit your review instead.");

  const review = await Review.create({ user: userId, product: productId, order: purchase._id, rating, comment }); // the unique index also blocks a double submit
  await refreshProductRating(productId);
  return review;
}

export async function updateReview(userId: string, reviewId: string, input: UpdateReviewInput) {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) throw ApiError.notFound("Review not found");
  if (input.rating !== undefined) review.rating = input.rating;
  if (input.comment !== undefined) review.comment = input.comment;
  await review.save();
  await refreshProductRating(String(review.product));
  return review;
}

export async function deleteReview(reviewId: string, userId?: string): Promise<void> {
  const review = await Review.findOneAndDelete({ _id: reviewId, ...(userId ? { user: userId } : {}) });
  if (!review) throw ApiError.notFound("Review not found");
  await refreshProductRating(String(review.product));
}

// ---------- Admin ----------

export async function listAdminReviews({ page, limit, rating, q }: AdminReviewsQuery) {
  const filter: Record<string, unknown> = {};
  if (rating) filter.rating = rating;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    const ids = (await Product.find({ name: rx }).select("_id").limit(100).lean()).map((p) => p._id);
    filter.$or = [{ comment: rx }, { product: { $in: ids } }];
  }
  const [reviews, total, [stats]] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("user", "name email").populate("product", "name slug"),
    Review.countDocuments(filter),
    Review.aggregate<{ avg: number; count: number }>([{ $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]),
  ]);
  const breakdown = await Review.aggregate<{ _id: number; count: number }>([{ $group: { _id: "$rating", count: { $sum: 1 } } }]);
  return {
    reviews,
    stats: { average: stats ? Math.round(stats.avg * 10) / 10 : 0, total: stats?.count ?? 0, distribution: [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: breakdown.find((b) => b._id === s)?.count ?? 0 })) },
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}
