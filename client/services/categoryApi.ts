import type { ApiSuccess, Category, CategoryInput } from "@/types";
import { api } from "./api";

type CategoryResponse = ApiSuccess<{ category: Category }>;
type CategoriesResponse = ApiSuccess<{ categories: Category[] }>;
const one = (r: CategoryResponse): Category => r.data.category;
const many = (r: CategoriesResponse): Category[] => r.data.categories;

export type CategoryChanges = Partial<CategoryInput> & { slug?: string; isArchived?: boolean };

export const categoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => "/categories",
      transformResponse: many,
      providesTags: ["Category"],
    }),
    getCategory: builder.query<Category, string>({
      query: (slug) => `/categories/${slug}`,
      transformResponse: one,
      providesTags: ["Category"],
    }),
    getAdminCategories: builder.query<Category[], void>({
      query: () => "/categories/admin/all",
      transformResponse: many,
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation<Category, CategoryInput>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      transformResponse: one,
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation<Category, { id: string; changes: CategoryChanges }>({
      query: ({ id, changes }) => ({ url: `/categories/${id}`, method: "PATCH", body: changes }),
      transformResponse: one,
      invalidatesTags: ["Category"],
    }),
    uploadCategoryImage: builder.mutation<Category, { id: string; file: File }>({
      query: ({ id, file }) => {
        const body = new FormData();
        body.append("image", file);
        return { url: `/categories/${id}/image`, method: "PUT", body };
      },
      transformResponse: one,
      invalidatesTags: ["Category"],
    }),
    removeCategoryImage: builder.mutation<Category, string>({
      query: (id) => ({ url: `/categories/${id}/image`, method: "DELETE" }),
      transformResponse: one,
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation<{ archived: boolean; message: string }, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      transformResponse: (r: ApiSuccess<{ archived: boolean }>) => ({ archived: r.data.archived, message: r.message }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useUploadCategoryImageMutation,
  useRemoveCategoryImageMutation,
  useDeleteCategoryMutation,
} = categoryApi;
