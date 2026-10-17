import { cache } from "react";
import type { ApiSuccess, Banner, Category, LatestReview, Product, ProductFilters, ProductList, ProductListParams } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Server-side fetch for Server Components. Returns null if the API is down, so pages can show an empty state instead of crashing.
 * `no-store` means a newly published article shows up on the next page load.
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as ApiSuccess<T>).data : null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  return (await serverFetch<{ categories: Category[] }>("/categories"))?.categories ?? [];
}

export async function getBanners(): Promise<Banner[]> {
  return (await serverFetch<{ banners: Banner[] }>("/banners"))?.banners ?? [];
}

export async function getProducts(params: ProductListParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return (await serverFetch<ProductList>(`/products?${query}`))?.products ?? [];
}

/** Like getProducts but with pagination info, and null (not an empty list) when the API fails, so pages can show an error state. */
export async function getProductList(params: ProductListParams = {}): Promise<ProductList | null> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  return serverFetch<ProductList>(`/products?${query}`);
}

export async function getProductFilters(categorySlug?: string): Promise<ProductFilters> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : "";
  return (await serverFetch<ProductFilters>(`/products/filters${query}`)) ?? { priceRange: { min: 0, max: 0 }, sizes: [] };
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await serverFetch<{ category: Category }>(`/categories/${encodeURIComponent(slug)}`))?.category ?? null;
}

/** Cached per request, so generateMetadata and the page share one API call. */
export const getProduct = cache(async (slug: string): Promise<Product | null> =>
  (await serverFetch<{ product: Product }>(`/products/${encodeURIComponent(slug)}`))?.product ?? null);

export async function getRelatedProducts(slug: string): Promise<Product[]> {
  return (await serverFetch<{ products: Product[] }>(`/products/${encodeURIComponent(slug)}/related`))?.products ?? [];
}

export async function getLatestReviews(limit = 6): Promise<LatestReview[]> {
  return (await serverFetch<{ reviews: LatestReview[] }>(`/reviews/latest?limit=${limit}`))?.reviews ?? [];
}

/** Every public product (slug and last change), for the sitemap. The API caps a page at 60, so this walks the pages. Null if the API is down. */
export async function getAllProductEntries(): Promise<Array<{ slug: string; updatedAt?: string }> | null> {
  const out: Array<{ slug: string; updatedAt?: string }> = [];
  for (let page = 1; page <= 100; page++) {
    const result = await getProductList({ page, limit: 60 });
    if (!result) return page === 1 ? null : out;
    out.push(...result.products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })));
    if (page >= result.pagination.totalPages) break;
  }
  return out;
}
