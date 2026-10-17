import { Router } from "express";
import { getCart, priceCart, saveCart } from "../controllers/cart.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { cartLinesSchema } from "../validations/cart.validation";

const router = Router();

router.post("/price", validate({ body: cartLinesSchema }), priceCart); // public: guests price their cart too
router.get("/", protect, getCart);
router.put("/", protect, validate({ body: cartLinesSchema }), saveCart);

export default router;
