import { Router } from "express";
import { addToWishlist, getWishlist, getWishlistIds, removeFromWishlist } from "../controllers/wishlist.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { wishlistParamSchema } from "../validations/wishlist.validation";

const router = Router();
router.use(protect);

router.get("/", getWishlist);
router.get("/ids", getWishlistIds);
router.post("/:productId", validate({ params: wishlistParamSchema }), addToWishlist);
router.delete("/:productId", validate({ params: wishlistParamSchema }), removeFromWishlist);

export default router;
