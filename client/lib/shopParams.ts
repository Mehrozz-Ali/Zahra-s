import type { ProductListParams, ProductSort, Size } from "@/types";

export const SIZE_OPTIONS: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
export const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "best-selling", label: "Best selling" },
  { value: "top-rated", label: "Top rated" },
];
export const PAGE_SIZE = 12;

/** Shop filters as they appear in the URL (the page size is fixed, `view` is display-only). */
export type ShopParams = Omit<ProductListParams, "limit"> & { view?: "list" };
export type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
const toNumber = (value: string | undefined): number | undefined => {
  const n = value === undefined || value === "" ? NaN : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Reads the URL query and keeps only valid values, so a hand-edited URL can never break the page. */
export function parseShopParams(raw: RawParams): ShopParams {
  const out: ShopParams = {};
  const q = first(raw.q)?.trim();
  if (q) out.q = q.slice(0, 100);
  const category = first(raw.category)?.trim();
  if (category) out.category = category.slice(0, 100);
  const size = first(raw.size);
  if (SIZE_OPTIONS.includes(size as Size)) out.size = size as Size;
  out.minPrice = toNumber(first(raw.minPrice));
  out.maxPrice = toNumber(first(raw.maxPrice));
  for (const flag of ["inStock", "onSale", "featured", "newArrival", "bestSeller"] as const) if (first(raw[flag]) === "true") out[flag] = true;
  const sort = first(raw.sort);
  if (SORT_OPTIONS.some((o) => o.value === sort) && sort !== "newest") out.sort = sort as ProductSort;
  const page = Number.parseInt(first(raw.page) ?? "", 10);
  if (Number.isInteger(page) && page > 1) out.page = page;
  if (first(raw.view) === "list") out.view = "list";
  return out;
}

export function toQueryString(params: ShopParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(key, String(value));
  return query.toString();
}

export const withQuery = (basePath: string, params: ShopParams): string => {
  const qs = toQueryString(params);
  return qs ? `${basePath}?${qs}` : basePath;
};
