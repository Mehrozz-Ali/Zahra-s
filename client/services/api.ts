import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ApiSuccess, HealthStatus } from "@/types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Single RTK Query API. Later phases add endpoints with api.injectEndpoints() in separate files.
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL, credentials: "include" }),
  tagTypes: ["User", "Product", "Category", "Cart", "Wishlist", "Order", "Review", "Coupon", "Customer", "Banner"],
  endpoints: (builder) => ({
    getHealth: builder.query<HealthStatus, void>({
      query: () => "/health",
      transformResponse: (response: ApiSuccess<HealthStatus>) => response.data,
    }),
  }),
});

export const { useGetHealthQuery } = api;
