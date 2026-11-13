import { Router } from "express";
import { addToWishlist, getWishlist, getWishlistIds, lookupWishlist, mergeWishlist, removeFromWishlist } from "../controllers/wishlist.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { wishlistIdsBodySchema, wishlistParamSchema } from "../validations/wishlist.validation";

const router = Router();

// Open to guests: show the articles whose ids a visitor keeps in their browser
router.post("/lookup", validate({ body: wishlistIdsBodySchema }), lookupWishlist);

// Everything below needs an account
router.use(protect);
router.get("/", getWishlist);
router.get("/ids", getWishlistIds);
router.post("/merge", validate({ body: wishlistIdsBodySchema }), mergeWishlist);
router.post("/:productId", validate({ params: wishlistParamSchema }), addToWishlist);
router.delete("/:productId", validate({ params: wishlistParamSchema }), removeFromWishlist);

export default router;
