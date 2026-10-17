import type { Types } from "mongoose";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { ApiError } from "../utils/ApiError";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validations/category.validation";
import { deleteImageQuietly, uploadImage } from "./cloudinary.service";

const IMAGE_TRANSFORM = [{ width: 800, height: 1000, crop: "fill", gravity: "auto" }, { quality: "auto", fetch_format: "auto" }];

async function productCounts(onlyActive: boolean): Promise<Map<string, number>> {
  const rows = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
    ...(onlyActive ? [{ $match: { status: "active" } }] : []),
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

async function findOrFail(id: string) {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

/** Storefront: only enabled, non-archived categories, with the number of active products in each. */
export async function listPublicCategories() {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true, isArchived: false }).sort({ sortOrder: 1, name: 1 }).select("-__v").lean(),
    productCounts(true),
  ]);
  return categories.map((c) => ({ ...c, productCount: counts.get(String(c._id)) ?? 0 }));
}

export async function getPublicCategory(slug: string) {
  const category = await Category.findOne({ slug, isActive: true, isArchived: false }).select("-__v").lean();
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

/** Admin: everything, including disabled and archived, with total product counts. */
export async function listAdminCategories() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ isArchived: 1, sortOrder: 1, name: 1 }).select("-__v").lean(),
    productCounts(false),
  ]);
  return categories.map((c) => ({ ...c, productCount: counts.get(String(c._id)) ?? 0 }));
}

export const createCategory = (input: CreateCategoryInput) => Category.create(input);

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const category = await findOrFail(id);
  if (input.isActive === true && category.isArchived && input.isArchived !== false) {
    throw ApiError.badRequest("Restore this category before enabling it");
  }
  Object.assign(category, input);
  if (input.isArchived === true) category.isActive = false;
  await category.save(); // runs slug and unique checks
  return category;
}

export async function setCategoryImage(id: string, file: Express.Multer.File | undefined) {
  if (!file) throw ApiError.badRequest("Please choose an image to upload");
  const category = await findOrFail(id);
  const uploaded = await uploadImage(file.buffer, "categories", IMAGE_TRANSFORM);
  const previous = category.image?.publicId;
  category.image = uploaded;
  await category.save();
  await deleteImageQuietly(previous);
  return category;
}

export async function removeCategoryImage(id: string) {
  const category = await findOrFail(id);
  const previous = category.image?.publicId;
  category.image = undefined;
  await category.save();
  await deleteImageQuietly(previous);
  return category;
}

/** Categories that still have products are archived (hidden), never hard-deleted, so no product is left orphaned. */
export async function deleteCategory(id: string): Promise<{ archived: boolean }> {
  const category = await findOrFail(id);
  if ((await Product.countDocuments({ category: category._id })) > 0) {
    category.isArchived = true;
    category.isActive = false;
    await category.save();
    return { archived: true };
  }
  const previous = category.image?.publicId;
  await category.deleteOne();
  await deleteImageQuietly(previous);
  return { archived: false };
}
