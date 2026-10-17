import type { ApiSuccess, User } from "@/types";
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput } from "@/lib/validations/auth";
import { clearCart } from "@/store/slices/cartSlice";
import { api } from "./api";

type UserPayload = ApiSuccess<{ user: User }>;
const unwrapUser = (response: UserPayload): User => response.data.user;
const unwrapMessage = (response: ApiSuccess<null>): string => response.message;

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/auth/me",
      transformResponse: unwrapUser,
      // Also "provided" when the request fails with 401, so login/logout can trigger a refetch
      providesTags: () => ["User"],
    }),
    login: builder.mutation<User, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation<string, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      transformResponse: unwrapMessage,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCart()); // the cart is saved to the account; don't leave it for the next person on this device
          dispatch(api.util.resetApiState());
        } catch {
          /* the component shows the error */
        }
      },
    }),
    forgotPassword: builder.mutation<string, ForgotPasswordInput>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
      transformResponse: unwrapMessage,
    }),
    resetPassword: builder.mutation<string, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
      transformResponse: unwrapMessage,
    }),
    verifyEmail: builder.mutation<{ alreadyVerified: boolean; message: string }, { token: string }>({
      query: (body) => ({ url: "/auth/verify-email", method: "POST", body }),
      transformResponse: (r: ApiSuccess<{ alreadyVerified: boolean }>) => ({ alreadyVerified: r.data.alreadyVerified, message: r.message }),
      invalidatesTags: ["User"], // a signed-in customer's banner should disappear
    }),
    resendVerification: builder.mutation<string, void>({
      query: () => ({ url: "/auth/resend-verification", method: "POST" }),
      transformResponse: (r: ApiSuccess<unknown>) => r.message,
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation<User, ChangePasswordInput>({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
      transformResponse: unwrapUser,
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
