import { Router } from "express";
import {
  createCategory, deleteCategory, deleteCategoryImage, getCategory, listAdminCategories, listCategories, updateCategory, uploadCategoryImage,
} from "../controllers/category.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadSingleImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { categorySlugParamSchema, createCategorySchema, updateCategorySchema } from "../validations/category.validation";
import { idParamSchema } from "../validations/common";

const router = Router();
const admin = [protect, adminOnly];

// Public
router.get("/", listCategories);
router.get("/admin/all", ...admin, listAdminCategories); // must stay above "/:slug"
router.get("/:slug", validate({ params: categorySlugParamSchema }), getCategory);

// Admin
router.post("/", ...admin, validate({ body: createCategorySchema }), createCategory);
router.patch("/:id", ...admin, validate({ params: idParamSchema, body: updateCategorySchema }), updateCategory);
router.put("/:id/image", ...admin, validate({ params: idParamSchema }), uploadLimiter, uploadSingleImage("image"), uploadCategoryImage);
router.delete("/:id/image", ...admin, validate({ params: idParamSchema }), deleteCategoryImage);
router.delete("/:id", ...admin, validate({ params: idParamSchema }), deleteCategory);

export default router;
