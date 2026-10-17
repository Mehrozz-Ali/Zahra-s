import * as productService from "../services/product.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { AdminProductQuery, CreateProductInput, ProductListQuery, UpdateProductInput } from "../validations/product.validation";

// req.query was already parsed and typed by the validate() middleware
export const listProducts = asyncHandler(async (req, res) => {
  sendSuccess(res, await productService.listPublicProducts(req.query as unknown as ProductListQuery), "Products fetched successfully");
});

export const getProductFilters = asyncHandler(async (req, res) => {
  sendSuccess(res, await productService.getProductFilters((req.query as { category?: string }).category), "Filters fetched successfully");
});

export const getProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { product: await productService.getPublicProduct(String(req.params.slug)) }, "Product fetched successfully");
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  sendSuccess(res, { products: await productService.getRelatedProducts(String(req.params.slug)) }, "Related products fetched successfully");
});

export const listAdminProducts = asyncHandler(async (req, res) => {
  sendSuccess(res, await productService.listAdminProducts(req.query as unknown as AdminProductQuery), "Articles fetched successfully");
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { product: await productService.getAdminProduct(String(req.params.id)) }, "Article fetched successfully");
});

export const createProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { product: await productService.createProduct(req.body as CreateProductInput) }, "Article published", 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { product: await productService.updateProduct(String(req.params.id), req.body as UpdateProductInput) }, "Article updated");
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const permanent = (req.query as { permanent?: boolean }).permanent === true;
  const { archived } = await productService.deleteProduct(String(req.params.id), permanent);
  sendSuccess(res, { archived }, archived ? "Article archived" : "Article deleted permanently");
});

export const uploadProductImages = asyncHandler(async (req, res) => {
  const images = await productService.uploadProductImages(req.files as Express.Multer.File[] | undefined);
  sendSuccess(res, { images }, "Images uploaded", 201);
});

export const deleteUploadedImage = asyncHandler(async (req, res) => {
  await productService.deleteUnusedProductImage((req.body as { publicId: string }).publicId);
  sendSuccess(res, null, "Image removed");
});
