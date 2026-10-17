import type { ApiSuccess, CartLineInput, CheckoutQuote, DeliveryMethod, Order, OrderList, ShippingAddress } from "@/types";
import { api } from "./api";

export interface PlaceOrderRequest {
  lines: CartLineInput[];
  shippingAddress: ShippingAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: "cod" | "stripe";
  couponCode?: string;
}

export const orderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /** A POST that only reads, so it is modelled as a query. */
    getCheckoutQuote: builder.query<CheckoutQuote, { lines: CartLineInput[]; couponCode?: string }>({
      query: (body) => ({ url: "/orders/quote", method: "POST", body }),
      transformResponse: (r: ApiSuccess<CheckoutQuote>) => r.data,
    }),
    placeOrder: builder.mutation<Order, PlaceOrderRequest>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      transformResponse: (r: ApiSuccess<{ order: Order }>) => r.data.order,
      invalidatesTags: ["Order"],
    }),
    getMyOrders: builder.query<OrderList, { page: number }>({
      query: ({ page }) => ({ url: "/orders", params: { page, limit: 10 } }),
      transformResponse: (r: ApiSuccess<OrderList>) => r.data,
      providesTags: ["Order"],
    }),
    cancelOrder: builder.mutation<Order, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: "POST" }),
      transformResponse: (r: ApiSuccess<{ order: Order }>) => r.data.order,
      invalidatesTags: ["Order"],
    }),
    getOrder: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      transformResponse: (r: ApiSuccess<{ order: Order }>) => r.data.order,
      providesTags: ["Order"],
    }),
  }),
});

export const { useGetCheckoutQuoteQuery, usePlaceOrderMutation, useGetMyOrdersQuery, useCancelOrderMutation, useGetOrderQuery } = orderApi;
