import { Router } from "express";
import { addAddress, deleteAddress, deleteAvatar, updateAddress, updateProfile, uploadAvatar } from "../controllers/user.controller";
import { protect } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadSingleImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validations/common";
import { addressSchema, updateAddressSchema, updateProfileSchema } from "../validations/user.validation";

const router = Router();
router.use(protect);

router.patch("/profile", validate({ body: updateProfileSchema }), updateProfile);
router.put("/avatar", uploadLimiter, uploadSingleImage("avatar"), uploadAvatar);
router.delete("/avatar", deleteAvatar);

router.post("/addresses", validate({ body: addressSchema }), addAddress);
router.patch("/addresses/:id", validate({ params: idParamSchema, body: updateAddressSchema }), updateAddress);
router.delete("/addresses/:id", validate({ params: idParamSchema }), deleteAddress);

export default router;
