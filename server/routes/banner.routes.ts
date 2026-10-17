import { Router } from "express";
import {
  createBanner, deleteBanner, deleteBannerImage, listAdminBanners, listBanners, reorderBanners, updateBanner, uploadBannerImage,
} from "../controllers/banner.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadSingleImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { bannerImageQuerySchema, createBannerSchema, reorderBannersSchema, updateBannerSchema } from "../validations/banner.validation";
import { idParamSchema } from "../validations/common";

const router = Router();
const admin = [protect, adminOnly];

router.get("/", listBanners); // public: the homepage slider
router.get("/admin/all", ...admin, listAdminBanners);
router.post("/", ...admin, validate({ body: createBannerSchema }), createBanner);
router.put("/reorder", ...admin, validate({ body: reorderBannersSchema }), reorderBanners); // above "/:id"
router.patch("/:id", ...admin, validate({ params: idParamSchema, body: updateBannerSchema }), updateBanner);
router.put("/:id/image", ...admin, validate({ params: idParamSchema, query: bannerImageQuerySchema }), uploadLimiter, uploadSingleImage("image"), uploadBannerImage);
router.delete("/:id/image", ...admin, validate({ params: idParamSchema, query: bannerImageQuerySchema }), deleteBannerImage);
router.delete("/:id", ...admin, validate({ params: idParamSchema }), deleteBanner);

export default router;
