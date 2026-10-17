import { Router } from "express";
import { createPaymentIntent } from "../controllers/payment.controller";
import { protect } from "../middleware/auth";
import { orderLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";

const router = Router();

// The Stripe webhook is mounted in app.ts because it needs the raw body
router.post("/orders/:id/intent", protect, orderLimiter, validate({ params: idParamSchema }), createPaymentIntent);

export default router;
