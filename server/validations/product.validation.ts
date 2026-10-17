import { z } from "zod";
import { PRODUCT_SORTS, PRODUCT_STATUSES, SIZES } from "../types";
import { objectId } from "./common";

const boolString = z.enum(["true", "false"]).transform((v) => v === "true");

const imageSchema = z.object({
  // Real images live on Cloudinary. The sample placeholder pictures from `npm run seed` (/seed/...) are also accepted so demo articles can be edited.
  url: z.string().refine((u) => (u.startsWith("https://res.cloudinary.com/") && z.string().url().safeParse(u).success) || /^\/seed\/[\w.-]+\.svg$/.test(u), "Images must be uploaded through the store"),
  publicId: z.string().refine((id) => id.startsWith("women-clothing-store/products/") || /^seed\/[\w-]+$/.test(id), "Invalid image reference"),
  isPrimary: z.boolean().default(false),
});

/** Stock per size, e.g. S: 5, M: 8. An article is one design in one colour: customers only choose a size. */
const sizesSchema = z
  .array(z.object({ size: z.enum(SIZES), stock: z.number().int("Stock must be a whole number").min(0).max(100_000) }))
  .min(1, "Add at least one size")
  .max(SIZES.length);

const productFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(160),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  price: z.number().positive("Price must be greater than 0").max(10_000_000),
  discountPrice: z.number().positive().max(10_000_000),
  category: objectId,
  images: z.array(imageSchema).max(10, "Up to 10 images"),
  sizes: sizesSchema,
  material: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/, "SKU can only use letters, numbers and hyphens").optional(),
  featured: z.boolean(),
  newArrival: z.boolean(),
  bestSeller: z.boolean(),
  onSale: z.boolean(),
  status: z.enum(PRODUCT_STATUSES),
};

type Checkable = { price?: number; discountPrice?: number | null; sizes?: z.infer<typeof sizesSchema> };

function check(value: Checkable, ctx: z.RefinementCtx): void {
  if (value.discountPrice != null && value.price !== undefined && value.discountPrice >= value.price) {
    ctx.addIssue({ code: "custom", path: ["discountPrice"], message: "Discount price must be lower than the regular price" });
  }
  if (value.sizes && new Set(value.sizes.map((s) => s.size)).size !== value.sizes.length) {
    ctx.addIssue({ code: "custom", path: ["sizes"], message: "Each size can only appear once" });
  }
}

export const createProductSchema = z
  .object({ ...productFields, discountPrice: productFields.discountPrice.optional() })
  .partial({ shortDescription: true, images: true, sizes: true, material: true, brand: true, sku: true, featured: true, newArrival: true, bestSeller: true, onSale: true, status: true })
  .superRefine(check);

export const updateProductSchema = z
  .object({ ...productFields, discountPrice: productFields.discountPrice.nullable() }) // null removes the discount
  .partial()
  .superRefine(check);

export const productSlugParamSchema = z.object({ slug: z.string().trim().min(1).max(200) });
export const deleteUploadedImageSchema = z.object({ publicId: z.string().startsWith("women-clothing-store/products/", "Invalid image reference").max(300) });
export const deleteProductQuerySchema = z.object({ permanent: boolString.optional() });

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(), // category slug
  slugs: z.string().trim().max(1000).optional(), // comma-separated product slugs (recently viewed)
  size: z.enum(SIZES).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: boolString.optional(),
  featured: boolString.optional(),
  newArrival: boolString.optional(),
  bestSeller: boolString.optional(),
  onSale: boolString.optional(),
  sort: z.enum(PRODUCT_SORTS).default("newest"),
});

export const productFiltersQuerySchema = z.object({ category: z.string().trim().max(100).optional() });

export const adminProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  category: objectId.optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  stock: z.enum(["all", "low", "out"]).default("all"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
