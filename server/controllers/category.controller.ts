import * as categoryService from "../services/category.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validations/category.validation";

export const listCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, { categories: await categoryService.listPublicCategories() }, "Categories fetched successfully");
});

export const getCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, { category: await categoryService.getPublicCategory(String(req.params.slug)) }, "Category fetched successfully");
});

export const listAdminCategories = asyncHandler(async (_req, res) => {
  sendSuccess(res, { categories: await categoryService.listAdminCategories() }, "Categories fetched successfully");
});

export const createCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, { category: await categoryService.createCategory(req.body as CreateCategoryInput) }, "Category created", 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, { category: await categoryService.updateCategory(String(req.params.id), req.body as UpdateCategoryInput) }, "Category updated");
});

export const uploadCategoryImage = asyncHandler(async (req, res) => {
  sendSuccess(res, { category: await categoryService.setCategoryImage(String(req.params.id), req.file) }, "Category image updated");
});

export const deleteCategoryImage = asyncHandler(async (req, res) => {
  sendSuccess(res, { category: await categoryService.removeCategoryImage(String(req.params.id)) }, "Category image removed");
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { archived } = await categoryService.deleteCategory(String(req.params.id));
  sendSuccess(res, { archived }, archived ? "Category has products, so it was archived instead of deleted" : "Category deleted");
});
