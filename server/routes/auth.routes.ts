import { Router } from "express";
import { changePassword, forgotPassword, login, logout, me, register, resendVerification, resetPassword, verifyEmail } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import { authLimiter, loginLimiter, registerLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validate";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "../validations/auth.validation";

const router = Router();

router.post("/register", registerLimiter, authLimiter, validate({ body: registerSchema }), register);
router.post("/login", ...loginLimiter, authLimiter, validate({ body: loginSchema }), login);
router.post("/logout", logout);
router.get("/me", protect, me);
router.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), resetPassword);
router.post("/verify-email", authLimiter, validate({ body: verifyEmailSchema }), verifyEmail);
router.post("/resend-verification", authLimiter, protect, resendVerification);
router.patch("/change-password", protect, validate({ body: changePasswordSchema }), changePassword);

export default router;
