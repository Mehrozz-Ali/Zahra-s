import type { ApiSuccess, WishlistItem } from "@/types";
import { api } from "./api";

type IdsResponse = ApiSuccess<{ ids: string[] }>;
const unwrapIds = (r: IdsResponse): string[] => r.data.ids;

export const wishlistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query<WishlistItem[], void>({
      query: () => "/wishlist",
      transformResponse: (r: ApiSuccess<{ items: WishlistItem[] }>) => r.data.items,
      providesTags: ["Wishlist"],
    }),
    getWishlistIds: builder.query<string[], void>({
      query: () => "/wishlist/ids",
      transformResponse: unwrapIds,
      providesTags: ["Wishlist"],
    }),
    addToWishlist: builder.mutation<string[], string>({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: "POST" }),
      transformResponse: unwrapIds,
      invalidatesTags: ["Wishlist"],
      // Update the hearts straight away instead of waiting for the refetch
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data: ids } = await queryFulfilled;
          dispatch(wishlistApi.util.updateQueryData("getWishlistIds", undefined, () => ids));
        } catch { /* the caller shows the error */ }
      },
    }),
    removeFromWishlist: builder.mutation<string[], string>({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: "DELETE" }),
      transformResponse: unwrapIds,
      invalidatesTags: ["Wishlist"],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data: ids } = await queryFulfilled;
          dispatch(wishlistApi.util.updateQueryData("getWishlistIds", undefined, () => ids));
        } catch { /* the caller shows the error */ }
      },
    }),
  }),
});

export const { useGetWishlistQuery, useGetWishlistIdsQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } = wishlistApi;
