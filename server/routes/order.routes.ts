import { Router } from "express";
import { cancelMyOrder, getOrder, listMyOrders, placeOrder, quote, trackOrder } from "../controllers/order.controller";
import { optionalAuth, protect } from "../middleware/auth";
import { orderLimiter, trackLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";
import { orderListQuerySchema, placeOrderSchema, quoteSchema, trackOrderSchema } from "../validations/order.validation";

const router = Router();

// Open to guests: pricing a cart, placing a cash-on-delivery order and tracking an order by number + phone
router.post("/quote", validate({ body: quoteSchema }), quote);
router.post("/track", trackLimiter, validate({ body: trackOrderSchema }), trackOrder);
router.post("/", orderLimiter, optionalAuth, validate({ body: placeOrderSchema }), placeOrder);

// Everything below needs an account
router.get("/", protect, validate({ query: orderListQuerySchema }), listMyOrders);
router.get("/:id", protect, validate({ params: idParamSchema }), getOrder);
router.post("/:id/cancel", protect, validate({ params: idParamSchema }), cancelMyOrder);

export default router;
