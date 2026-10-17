import { z } from "zod";
import { SIZE_OPTIONS } from "@/lib/constants";
import type { Product, ProductImage, ProductInput, ProductStatus, Size } from "@/types";

// Keep these rules in sync with server/validations/product.validation.ts
const intText = (what: string) => z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 100_000), `${what} must be a whole number`);

export const articleFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(160),
  shortDescription: z.string().trim().max(300, "Keep it under 300 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  price: z.coerce.number({ message: "Enter a price" }).positive("Price must be greater than 0").max(10_000_000),
  discountPrice: z.string().trim().refine((v) => v === "" || Number(v) > 0, "Must be more than 0"),
  category: z.string().min(1, "Choose a category"),
  images: z.array(z.object({ url: z.string(), publicId: z.string(), isPrimary: z.boolean() })).max(10),
  sizes: z.array(z.enum(SIZE_OPTIONS)),
  stock: z.record(z.string(), intText("Stock")), // size -> stock text; empty means 0
  material: z.string().trim().max(100),
  brand: z.string().trim().max(100),
  sku: z.string().trim().toUpperCase().refine((v) => v === "" || /^[A-Z0-9-]{3,40}$/.test(v), "SKU can only use letters, numbers and hyphens (3-40)"),
  featured: z.boolean(),
  newArrival: z.boolean(),
  bestSeller: z.boolean(),
  onSale: z.boolean(),
  status: z.enum(["active", "draft", "out_of_stock", "archived"]),
}).superRefine((v, ctx) => {
  if (v.discountPrice !== "" && Number(v.discountPrice) >= v.price) ctx.addIssue({ code: "custom", path: ["discountPrice"], message: "Discount price must be lower than the regular price" });
  if (v.status === "active") {
    if (v.images.length === 0) ctx.addIssue({ code: "custom", path: ["images"], message: "An active article needs at least one image. Save it as a draft otherwise." });
    if (v.sizes.length === 0) ctx.addIssue({ code: "custom", path: ["sizes"], message: "An active article needs at least one size. Save it as a draft otherwise." });
  }
});

export type ArticleFormInput = z.input<typeof articleFormSchema>;
export type ArticleFormOutput = z.output<typeof articleFormSchema>;

/** Starting values: blank for a new article, or the saved article when editing. */
export function toFormDefaults(product?: Product): ArticleFormInput {
  if (!product) {
    return { name: "", shortDescription: "", description: "", price: "" as unknown as number, discountPrice: "", category: "", images: [], sizes: ["S", "M", "L"], stock: {}, material: "", brand: "", sku: "", featured: false, newArrival: false, bestSeller: false, onSale: false, status: "draft" };
  }
  const used = new Set<Size>(product.sizes.map((s) => s.size));
  const sizes = SIZE_OPTIONS.filter((s) => used.has(s));
  return {
    name: product.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: product.price,
    discountPrice: product.discountPrice ? String(product.discountPrice) : "",
    category: product.category._id,
    images: product.images.map(({ url, publicId, isPrimary }) => ({ url, publicId, isPrimary })),
    sizes,
    stock: Object.fromEntries(product.sizes.map((s) => [s.size, String(s.stock)])),
    material: product.material ?? "",
    brand: product.brand ?? "",
    sku: product.sku ?? "",
    featured: product.featured, newArrival: product.newArrival, bestSeller: product.bestSeller, onSale: product.onSale,
    status: product.status,
  };
}

/** The API body. Creating leaves empty optional fields out; editing sends null to remove the discount. */
export function toProductInput(v: ArticleFormOutput, mode: "create" | "edit"): ProductInput {
  const discount = v.discountPrice === "" ? null : Number(v.discountPrice);
  return {
    name: v.name,
    shortDescription: v.shortDescription || (mode === "edit" ? "" : undefined),
    description: v.description,
    price: v.price,
    ...(mode === "edit" ? { discountPrice: discount } : discount !== null ? { discountPrice: discount } : {}),
    category: v.category,
    images: v.images as ProductImage[],
    sizes: v.sizes.map((size) => ({ size, stock: Number(v.stock[size] || 0) })),
    material: v.material || (mode === "edit" ? "" : undefined),
    brand: v.brand || (mode === "edit" ? "" : undefined),
    ...(v.sku ? { sku: v.sku } : {}),
    featured: v.featured, newArrival: v.newArrival, bestSeller: v.bestSeller, onSale: v.onSale,
    status: v.status as ProductStatus,
  };
}
