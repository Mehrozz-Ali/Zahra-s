import type { FilterQuery, PipelineStage } from "mongoose";
import { Category } from "../models/Category";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { Product, sumStock, type IProduct } from "../models/Product";
import { Review } from "../models/Review";
import { Wishlist } from "../models/Wishlist";
import { LOW_STOCK_THRESHOLD, SIZES, type ProductSort, type Size } from "../types";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";
import type { AdminProductQuery, CreateProductInput, ProductListQuery, UpdateProductInput } from "../validations/product.validation";
import { deleteImage, deleteImageQuietly, uploadImages } from "./cloudinary.service";

export const MAX_UPLOAD_BATCH = 10;
// Longest side capped at 1600px (aspect ratio kept), then optimised for the web
const PRODUCT_IMAGE_TRANSFORM = [{ width: 1600, height: 2000, crop: "limit" }, { quality: "auto", fetch_format: "auto" }];
const CARD_FIELDS = "-description -__v";
const SORTS: Record<ProductSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  "price-low": { finalPrice: 1, _id: 1 },
  "price-high": { finalPrice: -1, _id: 1 },
  "best-selling": { soldCount: -1, createdAt: -1 },
  "top-rated": { rating: -1, numReviews: -1, _id: 1 },
};

async function assertCategory(id: string): Promise<void> {
  const category = await Category.findById(id).select("isArchived");
  if (!category || category.isArchived) throw ApiError.badRequest("Choose a valid category", [{ field: "category", message: "Category not found" }]);
}

function assertPublishable(product: IProduct): void {
  if (product.status === "active" && (product.images.length === 0 || product.sizes.length === 0)) {
    throw ApiError.badRequest("An active article needs at least one image and at least one size. Save it as a draft instead.");
  }
}

/** Active with no stock -> out_of_stock. Restocked (and status not touched by the admin) -> active again. */
function syncStockStatus(product: IProduct, restocked: boolean): void {
  const total = sumStock(product.sizes);
  if (product.status === "active" && total === 0) product.status = "out_of_stock";
  else if (restocked && product.status === "out_of_stock" && total > 0) product.status = "active";
}

async function findOrFail(id: string) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound("Article not found");
  return product;
}

// ---------- Storefront ----------

export async function listPublicProducts(q: ProductListQuery) {
  const activeCategories = await Category.find({ isActive: true, isArchived: false }).select("name slug").lean();
  const visible = q.category ? activeCategories.filter((c) => c.slug === q.category) : activeCategories;
  const filter: Record<string, unknown> = { status: "active", category: { $in: visible.map((c) => c._id) } };

  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    const categoryIds = activeCategories.filter((c) => rx.test(c.name)).map((c) => c._id);
    filter.$or = [{ name: rx }, { sku: rx }, { description: rx }, { shortDescription: rx }, { category: { $in: categoryIds } }];
  }
  if (q.size) filter.sizes = { $elemMatch: { size: q.size, stock: { $gt: 0 } } };
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.finalPrice = { ...(q.minPrice !== undefined ? { $gte: q.minPrice } : {}), ...(q.maxPrice !== undefined ? { $lte: q.maxPrice } : {}) };
  }
  if (q.slugs) filter.slug = { $in: q.slugs.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12) };
  if (q.inStock) filter.totalStock = { $gt: 0 };
  for (const flag of ["featured", "newArrival", "bestSeller", "onSale"] as const) if (q[flag]) filter[flag] = true;

  const where = filter as FilterQuery<IProduct>;
  const [products, total] = await Promise.all([
    Product.find(where).select(CARD_FIELDS).sort(SORTS[q.sort]).skip((q.page - 1) * q.limit).limit(q.limit).populate("category", "name slug"),
    Product.countDocuments(where),
  ]);
  return { products, pagination: buildPaginationMeta(total, q) };
}

/** Real filter options for the shop sidebar: sizes in stock, and the price range of what is for sale. */
export async function getProductFilters(categorySlug?: string) {
  const categories = await Category.find({ isActive: true, isArchived: false }).select("slug").lean();
  const visible = categorySlug ? categories.filter((c) => c.slug === categorySlug) : categories;
  const match = { status: "active", category: { $in: visible.map((c) => c._id) } };

  const [range, sizes] = await Promise.all([
    Product.aggregate<{ min: number; max: number }>([{ $match: match }, { $group: { _id: null, min: { $min: "$finalPrice" }, max: { $max: "$finalPrice" } } }]),
    Product.aggregate<{ _id: Size }>([
      { $match: match },
      { $unwind: "$sizes" },
      { $match: { "sizes.stock": { $gt: 0 } } },
      { $group: { _id: "$sizes.size" } },
    ]),
  ]);

  const available = new Set(sizes.map((s) => s._id));
  return {
    priceRange: { min: Math.floor(range[0]?.min ?? 0), max: Math.ceil(range[0]?.max ?? 0) },
    sizes: SIZES.filter((s) => available.has(s)),
  };
}

export async function getPublicProduct(slug: string) {
  const product = await Product.findOne({ slug, status: "active" }).populate<{ category: { isActive: boolean; isArchived: boolean } }>("category", "name slug isActive isArchived");
  if (!product || !product.category.isActive || product.category.isArchived) throw ApiError.notFound("Product not found");
  return product;
}

export async function getRelatedProducts(slug: string, limit = 4) {
  const product = await Product.findOne({ slug, status: "active" }).select("category");
  if (!product) throw ApiError.notFound("Product not found");
  return Product.find({ status: "active", category: product.category, _id: { $ne: product._id } })
    .select(CARD_FIELDS).sort({ soldCount: -1, createdAt: -1 }).limit(limit).populate("category", "name slug");
}

// ---------- Admin ----------

export async function listAdminProducts(q: AdminProductQuery) {
  const filter: Record<string, unknown> = {};
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (q.category) filter.category = q.category;
  if (q.status) filter.status = q.status;
  if (q.stock === "out") filter.totalStock = 0;
  if (q.stock === "low") filter.totalStock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };

  const where = filter as FilterQuery<IProduct>;
  const [products, total] = await Promise.all([
    Product.find(where).select(CARD_FIELDS).sort({ createdAt: -1, _id: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate("category", "name slug"),
    Product.countDocuments(where),
  ]);
  return { products, pagination: buildPaginationMeta(total, q) };
}

export async function getAdminProduct(id: string) {
  const product = await findOrFail(id);
  return product.populate("category", "name slug");
}

export async function createProduct(input: CreateProductInput) {
  await assertCategory(input.category);
  const product = new Product(input);
  assertPublishable(product);
  syncStockStatus(product, false);
  await product.save(); // validates, generates slug and SKU, totals stock
  return product.populate("category", "name slug");
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const product = await findOrFail(id);
  const previousTotal = product.totalStock;
  const previousImages = product.images.map((i) => i.publicId);
  if (input.category) await assertCategory(input.category);

  const { discountPrice, ...fields } = input;
  Object.assign(product, fields);
  if (discountPrice !== undefined) product.discountPrice = discountPrice ?? undefined;
  assertPublishable(product);
  syncStockStatus(product, input.status === undefined && previousTotal === 0);
  await product.save();

  const kept = new Set(product.images.map((i) => i.publicId));
  await Promise.all(previousImages.filter((p) => !kept.has(p)).map((p) => deleteImageQuietly(p))); // clean up removed images
  return product.populate("category", "name slug");
}

/** Archives by default. `permanent` deletes for good, but only if no order ever contained the article. */
export async function deleteProduct(id: string, permanent: boolean): Promise<{ archived: boolean }> {
  const product = await findOrFail(id);
  if (!permanent) {
    product.status = "archived";
    await product.save();
    return { archived: true };
  }
  if (await Order.exists({ "items.product": product._id })) {
    throw ApiError.conflict("This article has been ordered, so it cannot be deleted permanently. Archive it instead.");
  }
  await Promise.all([
    Cart.updateMany({}, { $pull: { items: { product: product._id } } }),
    Wishlist.updateMany({}, { $pull: { products: product._id } }),
    Review.deleteMany({ product: product._id }),
  ]);
  await product.deleteOne();
  await Promise.all(product.images.map((i) => deleteImageQuietly(i.publicId)));
  return { archived: false };
}

// ---------- Images ----------

/** Uploads to Cloudinary and returns the references the article form then submits with the article. */
export async function uploadProductImages(files: Express.Multer.File[] | undefined) {
  if (!files || files.length === 0) throw ApiError.badRequest("Please choose at least one image");
  const images = await uploadImages(files.map((f) => f.buffer), "products", PRODUCT_IMAGE_TRANSFORM);
  return images.map((image) => ({ ...image, isPrimary: false }));
}

/** For an image uploaded in the form and then discarded before the article was saved. */
export async function deleteUnusedProductImage(publicId: string): Promise<void> {
  if (await Product.exists({ "images.publicId": publicId })) throw ApiError.conflict("This image belongs to an article. Remove it by editing the article.");
  await deleteImage(publicId);
}
