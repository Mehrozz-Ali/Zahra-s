import { getAuthUser } from "../middleware/auth";
import * as authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { clearAuthCookie, setAuthCookie } from "../utils/generateToken";
import { sendSuccess } from "../utils/sendResponse";
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput, VerifyEmailInput } from "../validations/auth.validation";

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body as RegisterInput);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, "Account created successfully", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body as LoginInput);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, "Logged in successfully");
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, null, "Logged out successfully");
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(getAuthUser(req).id);
  sendSuccess(res, { user }, "Profile fetched successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset((req.body as ForgotPasswordInput).email);
  sendSuccess(res, null, "If an account exists for this email, a reset link has been sent");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body as ResetPasswordInput;
  await authService.resetPassword(token, password);
  sendSuccess(res, null, "Password updated. You can now log in");
});

export const changePassword = asyncHandler(async (req, res) => {
  const { user, token } = await authService.changePassword(getAuthUser(req).id, req.body as ChangePasswordInput);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, "Password changed successfully");
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { alreadyVerified } = await authService.verifyEmail((req.body as VerifyEmailInput).token);
  sendSuccess(res, { alreadyVerified }, alreadyVerified ? "Your email was already confirmed" : "Email confirmed. Welcome!");
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { alreadyVerified } = await authService.resendEmailVerification(getAuthUser(req).id);
  sendSuccess(res, { alreadyVerified }, alreadyVerified ? "Your email is already confirmed" : "We have sent a new confirmation link to your email");
});
