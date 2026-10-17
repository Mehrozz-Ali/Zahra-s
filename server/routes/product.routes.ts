import { Router } from "express";
import {
  createProduct, deleteProduct, deleteUploadedImage, getAdminProduct, getProduct, getProductFilters, getRelatedProducts, listAdminProducts, listProducts, updateProduct, uploadProductImages,
} from "../controllers/product.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadMultipleImages } from "../middleware/upload";
import { MAX_UPLOAD_BATCH } from "../services/product.service";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";
import {
  adminProductQuerySchema, createProductSchema, deleteProductQuerySchema, deleteUploadedImageSchema, productFiltersQuerySchema, productListQuerySchema, productSlugParamSchema, updateProductSchema,
} from "../validations/product.validation";

const router = Router();
const admin = [protect, adminOnly];

// Public
router.get("/", validate({ query: productListQuerySchema }), listProducts);
router.get("/filters", validate({ query: productFiltersQuerySchema }), getProductFilters); // must stay above "/:slug"

// Admin reads (must stay above "/:slug")
router.get("/admin/all", ...admin, validate({ query: adminProductQuerySchema }), listAdminProducts);
router.get("/admin/:id", ...admin, validate({ params: idParamSchema }), getAdminProduct);

router.get("/:slug/related", validate({ params: productSlugParamSchema }), getRelatedProducts);
router.get("/:slug", validate({ params: productSlugParamSchema }), getProduct);

// Admin writes
router.post("/images", ...admin, uploadLimiter, uploadMultipleImages("images", MAX_UPLOAD_BATCH), uploadProductImages);
router.delete("/images", ...admin, validate({ body: deleteUploadedImageSchema }), deleteUploadedImage); // before "/:id"
router.post("/", ...admin, validate({ body: createProductSchema }), createProduct);
router.patch("/:id", ...admin, validate({ params: idParamSchema, body: updateProductSchema }), updateProduct);
router.delete("/:id", ...admin, validate({ params: idParamSchema, query: deleteProductQuerySchema }), deleteProduct);

export default router;
