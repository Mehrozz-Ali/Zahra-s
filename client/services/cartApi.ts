import type { ApiSuccess, CartLineInput, CartPricing } from "@/types";
import { api } from "./api";

export const cartApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** Prices lines from live product data. A POST, but it only reads, so it is modelled as a query. */
    getCartPricing: builder.query<CartPricing, CartLineInput[]>({
      query: (lines) => ({ url: "/cart/price", method: "POST", body: { lines } }),
      transformResponse: (r: ApiSuccess<CartPricing>) => r.data,
    }),
    getSavedCart: builder.query<CartLineInput[], void>({
      query: () => "/cart",
      transformResponse: (r: ApiSuccess<{ lines: CartLineInput[] }>) => r.data.lines,
    }),
    saveServerCart: builder.mutation<CartLineInput[], CartLineInput[]>({
      query: (lines) => ({ url: "/cart", method: "PUT", body: { lines } }),
      transformResponse: (r: ApiSuccess<{ lines: CartLineInput[] }>) => r.data.lines,
    }),
  }),
});

export const { useGetCartPricingQuery } = cartApi;
