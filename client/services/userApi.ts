import type { ApiSuccess, User } from "@/types";
import type { AddressFormInput, ProfileInput } from "@/lib/validations/user";
import { api } from "./api";

const unwrapUser = (response: ApiSuccess<{ user: User }>): User => response.data.user;

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation<User, ProfileInput>({
      query: (body) => ({ url: "/users/profile", method: "PATCH", body }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    uploadAvatar: builder.mutation<User, File>({
      query: (file) => {
        const body = new FormData();
        body.append("avatar", file);
        return { url: "/users/avatar", method: "PUT", body };
      },
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    removeAvatar: builder.mutation<User, void>({
      query: () => ({ url: "/users/avatar", method: "DELETE" }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    addAddress: builder.mutation<User, AddressFormInput>({
      query: (body) => ({ url: "/users/addresses", method: "POST", body }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    updateAddress: builder.mutation<User, { id: string; changes: Partial<AddressFormInput> }>({
      query: ({ id, changes }) => ({ url: `/users/addresses/${id}`, method: "PATCH", body: changes }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
    deleteAddress: builder.mutation<User, string>({
      query: (id) => ({ url: `/users/addresses/${id}`, method: "DELETE" }),
      transformResponse: unwrapUser,
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = userApi;
