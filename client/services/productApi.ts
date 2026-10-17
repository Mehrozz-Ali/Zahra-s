import type { AdminProductListParams, ApiSuccess, Product, ProductImage, ProductInput, ProductList, ProductListParams } from "@/types";
import { api } from "./api";

const one = (r: ApiSuccess<{ product: Product }>): Product => r.data.product;
const list = (r: ApiSuccess<ProductList>): ProductList => r.data;

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductList, ProductListParams | void>({
      query: (params) => ({ url: "/products", params: params ?? undefined }),
      transformResponse: list,
      providesTags: ["Product"],
    }),
    getProduct: builder.query<Product, string>({
      query: (slug) => `/products/${slug}`,
      transformResponse: one,
      providesTags: ["Product"],
    }),
    getRelatedProducts: builder.query<Product[], string>({
      query: (slug) => `/products/${slug}/related`,
      transformResponse: (r: ApiSuccess<{ products: Product[] }>) => r.data.products,
      providesTags: ["Product"],
    }),
    getAdminProducts: builder.query<ProductList, AdminProductListParams | void>({
      query: (params) => ({ url: "/products/admin/all", params: params ?? undefined }),
      transformResponse: list,
      providesTags: ["Product"],
    }),
    getAdminProduct: builder.query<Product, string>({
      query: (id) => `/products/admin/${id}`,
      transformResponse: one,
      providesTags: ["Product"],
    }),
    createProduct: builder.mutation<Product, ProductInput>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      transformResponse: one,
      invalidatesTags: ["Product", "Category"], // category product counts change too
    }),
    updateProduct: builder.mutation<Product, { id: string; changes: Partial<ProductInput> }>({
      query: ({ id, changes }) => ({ url: `/products/${id}`, method: "PATCH", body: changes }),
      transformResponse: one,
      invalidatesTags: ["Product", "Category"],
    }),
    uploadProductImages: builder.mutation<ProductImage[], File[]>({
      query: (files) => {
        const body = new FormData();
        files.forEach((file) => body.append("images", file));
        return { url: "/products/images", method: "POST", body };
      },
      transformResponse: (r: ApiSuccess<{ images: ProductImage[] }>) => r.data.images,
    }),
    deleteUploadedImage: builder.mutation<null, string>({
      query: (publicId) => ({ url: "/products/images", method: "DELETE", body: { publicId } }),
      transformResponse: () => null,
    }),
    deleteProduct: builder.mutation<{ archived: boolean; message: string }, { id: string; permanent?: boolean }>({
      query: ({ id, permanent }) => ({ url: `/products/${id}`, method: "DELETE", params: permanent ? { permanent: true } : undefined }),
      transformResponse: (r: ApiSuccess<{ archived: boolean }>) => ({ archived: r.data.archived, message: r.message }),
      invalidatesTags: ["Product", "Category"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImagesMutation,
  useDeleteUploadedImageMutation,
  useDeleteProductMutation,
} = productApi;
