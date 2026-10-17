import { Router } from "express";
import { subscribe } from "../controllers/newsletter.controller";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { subscribeSchema } from "../validations/newsletter.validation";

const router = Router();

router.post("/subscribe", authLimiter, validate({ body: subscribeSchema }), subscribe); // strict limiter stops signup spam

export default router;
