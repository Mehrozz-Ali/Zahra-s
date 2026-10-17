import type { ApiSuccess, Banner, BannerInput } from "@/types";
import { api } from "./api";

type BannerResponse = ApiSuccess<{ banner: Banner }>;
type BannersResponse = ApiSuccess<{ banners: Banner[] }>;
const one = (r: BannerResponse): Banner => r.data.banner;
const many = (r: BannersResponse): Banner[] => r.data.banners;

export type BannerKind = "desktop" | "mobile";

export const bannerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminBanners: builder.query<Banner[], void>({
      query: () => "/banners/admin/all",
      transformResponse: many,
      providesTags: ["Banner"],
    }),
    createBanner: builder.mutation<Banner, Partial<BannerInput>>({
      query: (body) => ({ url: "/banners", method: "POST", body }),
      transformResponse: one,
      invalidatesTags: ["Banner"],
    }),
    updateBanner: builder.mutation<Banner, { id: string; changes: Partial<BannerInput> }>({
      query: ({ id, changes }) => ({ url: `/banners/${id}`, method: "PATCH", body: changes }),
      transformResponse: one,
      invalidatesTags: ["Banner"],
    }),
    uploadBannerImage: builder.mutation<Banner, { id: string; file: File; kind: BannerKind }>({
      query: ({ id, file, kind }) => {
        const body = new FormData();
        body.append("image", file);
        return { url: `/banners/${id}/image?kind=${kind}`, method: "PUT", body };
      },
      transformResponse: one,
      invalidatesTags: ["Banner"],
    }),
    removeBannerImage: builder.mutation<Banner, { id: string; kind: BannerKind }>({
      query: ({ id, kind }) => ({ url: `/banners/${id}/image?kind=${kind}`, method: "DELETE" }),
      transformResponse: one,
      invalidatesTags: ["Banner"],
    }),
    reorderBanners: builder.mutation<Banner[], string[]>({
      query: (ids) => ({ url: "/banners/reorder", method: "PUT", body: { ids } }),
      transformResponse: many,
      invalidatesTags: ["Banner"],
    }),
    deleteBanner: builder.mutation<void, string>({
      query: (id) => ({ url: `/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["Banner"],
    }),
  }),
});

export const {
  useGetAdminBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useUploadBannerImageMutation,
  useRemoveBannerImageMutation,
  useReorderBannersMutation,
  useDeleteBannerMutation,
} = bannerApi;
