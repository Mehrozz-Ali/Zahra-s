import type { ApiSuccess } from "@/types";
import { api } from "./api";

export const paymentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPaymentIntent: builder.mutation<{ clientSecret: string }, string>({
      query: (orderId) => ({ url: `/payments/orders/${orderId}/intent`, method: "POST" }),
      transformResponse: (r: ApiSuccess<{ clientSecret: string }>) => r.data,
    }),
  }),
});

export const { useCreatePaymentIntentMutation } = paymentApi;
