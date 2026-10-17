import { Router } from "express";
import bannerRoutes from "./banner.routes";
import authRoutes from "./auth.routes";
import cartRoutes from "./cart.routes";
import categoryRoutes from "./category.routes";
import healthRoutes from "./health.routes";
import newsletterRoutes from "./newsletter.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import productRoutes from "./product.routes";
import adminRoutes from "./admin.routes";
import couponRoutes from "./coupon.routes";
import reviewRoutes from "./review.routes";
import userRoutes from "./user.routes";
import wishlistRoutes from "./wishlist.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/coupons", couponRoutes);
router.use("/admin", adminRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/banners", bannerRoutes);

export default router;
