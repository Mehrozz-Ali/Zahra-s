import type { ApiSuccess, Coupon, CouponList } from "@/types";
import type { CouponFormValues } from "@/lib/validations/coupon";
import { api } from "./api";

export interface CouponListParams { page: number; status: string; q: string }

export const couponApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query<CouponList, CouponListParams>({
      query: ({ page, status, q }) => ({ url: "/coupons", params: { page, limit: 15, status, ...(q ? { q } : {}) } }),
      transformResponse: (r: ApiSuccess<CouponList>) => r.data,
      providesTags: ["Coupon"],
    }),
    createCoupon: builder.mutation<Coupon, CouponFormValues>({
      query: (body) => ({ url: "/coupons", method: "POST", body }),
      transformResponse: (r: ApiSuccess<{ coupon: Coupon }>) => r.data.coupon,
      invalidatesTags: ["Coupon"],
    }),
    updateCoupon: builder.mutation<Coupon, { id: string; body: Partial<CouponFormValues> }>({
      query: ({ id, body }) => ({ url: `/coupons/${id}`, method: "PATCH", body }),
      transformResponse: (r: ApiSuccess<{ coupon: Coupon }>) => r.data.coupon,
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation<void, string>({
      query: (id) => ({ url: `/coupons/${id}`, method: "DELETE" }),
      invalidatesTags: ["Coupon"],
    }),
  }),
});

export const { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } = couponApi;
