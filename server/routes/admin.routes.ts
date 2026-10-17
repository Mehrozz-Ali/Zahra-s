import { Router } from "express";
import { getAnalytics, getCustomer, getDashboard, getOrder, listCustomers, listOrders, updateCustomerStatus, updateOrderStatus } from "../controllers/admin.controller";
import { adminOnly } from "../middleware/admin";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { adminAnalyticsQuerySchema, adminCustomersQuerySchema, adminOrdersQuerySchema, updateCustomerStatusSchema, updateOrderStatusSchema } from "../validations/admin.validation";
import { idParamSchema } from "../validations/common";

// Admin-only endpoints for the dashboard, orders and customers. Articles, categories, coupons and reviews have their own admin routes.
const router = Router();
router.use(protect, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/analytics", validate({ query: adminAnalyticsQuerySchema }), getAnalytics);

router.get("/orders", validate({ query: adminOrdersQuerySchema }), listOrders);
router.get("/orders/:id", validate({ params: idParamSchema }), getOrder);
router.patch("/orders/:id/status", validate({ params: idParamSchema, body: updateOrderStatusSchema }), updateOrderStatus);

router.get("/customers", validate({ query: adminCustomersQuerySchema }), listCustomers);
router.get("/customers/:id", validate({ params: idParamSchema }), getCustomer);
router.patch("/customers/:id/status", validate({ params: idParamSchema, body: updateCustomerStatusSchema }), updateCustomerStatus);

export default router;
