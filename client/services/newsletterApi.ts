import type { ApiSuccess } from "@/types";
import { api } from "./api";

export const newsletterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    subscribe: builder.mutation<string, { email: string }>({
      query: (body) => ({ url: "/newsletter/subscribe", method: "POST", body }),
      transformResponse: (r: ApiSuccess<null>) => r.message,
    }),
  }),
});

export const { useSubscribeMutation } = newsletterApi;
