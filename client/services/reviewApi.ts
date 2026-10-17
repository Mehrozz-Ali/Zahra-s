import type { AdminReviewList, ApiSuccess, MyReviewState, ReviewList } from "@/types";
import type { ReviewFormInput } from "@/lib/validations/review";
import { api } from "./api";

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query<ReviewList, { productId: string; page: number }>({
      query: ({ productId, page }) => `/reviews/product/${productId}?page=${page}&limit=5`,
      transformResponse: (r: ApiSuccess<ReviewList>) => r.data,
      providesTags: (_r, _e, { productId }) => [{ type: "Review", id: productId }],
    }),
    getMyReviewState: builder.query<MyReviewState, string>({
      query: (productId) => `/reviews/product/${productId}/mine`,
      transformResponse: (r: ApiSuccess<MyReviewState>) => r.data,
      providesTags: (_r, _e, productId) => [{ type: "Review", id: productId }],
    }),
    createReview: builder.mutation<void, ReviewFormInput & { productId: string }>({
      query: (body) => ({ url: "/reviews", method: "POST", body }),
      // Also refresh products, since the average rating and count changed
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Review", id: productId }, "Product"],
    }),
    updateReview: builder.mutation<void, { id: string; productId: string } & Partial<ReviewFormInput>>({
      query: ({ id, productId: _p, ...body }) => ({ url: `/reviews/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Review", id: productId }, "Product"],
    }),
    deleteReview: builder.mutation<void, { id: string; productId: string }>({
      query: ({ id }) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { productId }) => [{ type: "Review", id: productId }, "Product"],
    }),
    getAdminReviews: builder.query<AdminReviewList, { page: number; rating?: number; q?: string }>({
      query: ({ page, rating, q }) => ({ url: "/reviews/admin/all", params: { page, limit: 15, ...(rating ? { rating } : {}), ...(q ? { q } : {}) } }),
      transformResponse: (r: ApiSuccess<AdminReviewList>) => r.data,
      providesTags: ["Review"],
    }),
    adminDeleteReview: builder.mutation<void, string>({
      query: (id) => ({ url: `/reviews/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Review", "Product"], // the product's average rating changes
    }),
  }),
});

export const {
  useGetAdminReviewsQuery, useAdminDeleteReviewMutation, useGetProductReviewsQuery, useGetMyReviewStateQuery, useCreateReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation } = reviewApi;
