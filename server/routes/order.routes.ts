import { Router } from "express";
import { cancelMyOrder, getOrder, listMyOrders, placeOrder, quote } from "../controllers/order.controller";
import { protect } from "../middleware/auth";
import { orderLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";
import { orderListQuerySchema, placeOrderSchema, quoteSchema } from "../validations/order.validation";

const router = Router();
router.use(protect);

router.post("/quote", validate({ body: quoteSchema }), quote);
router.post("/", orderLimiter, validate({ body: placeOrderSchema }), placeOrder);
router.get("/", validate({ query: orderListQuerySchema }), listMyOrders);
router.get("/:id", validate({ params: idParamSchema }), getOrder);
router.post("/:id/cancel", validate({ params: idParamSchema }), cancelMyOrder);

export default router;
