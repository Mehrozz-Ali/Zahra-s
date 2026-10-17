import { createHash, randomBytes } from "crypto";
import { env } from "../config/env";
import { User } from "../models/User";
import type { ChangePasswordInput, LoginInput, RegisterInput } from "../validations/auth.validation";
import { ApiError } from "../utils/ApiError";
import { signToken } from "../utils/generateToken";
import { sendEmailInBackground, sendPasswordResetEmail, toMessage } from "./email.service";
import { verifyEmailEmail, welcomeEmail } from "../emails/templates";

const RESET_TOKEN_MINUTES = 30;
const VERIFY_TOKEN_HOURS = 24;
const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export async function registerUser(input: RegisterInput) {
  if (await User.exists({ email: input.email })) throw ApiError.conflict("An account with this email already exists");
  // role is never taken from the request: public registration always creates a customer
  const user = await User.create({ name: input.name, email: input.email, password: input.password, phone: input.phone, role: "customer" });
  await issueEmailVerification(user.id); // never blocks or fails the sign-up
  return { user, token: signToken({ id: user.id, role: user.role }) };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated. Please contact support.");
  user.lastLoginAt = new Date();
  await user.save();
  return { user, token: signToken({ id: user.id, role: user.role }) };
}

export async function getCurrentUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.unauthorized();
  return user;
}

/** Always resolves, so the response never reveals whether an email is registered. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return;

  const rawToken = randomBytes(32).toString("hex");
  user.passwordResetToken = hashToken(rawToken); // only the hash is stored
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, user.name, `${env.CLIENT_URL}/auth/reset-password?token=${rawToken}`);
  } catch (error) {
    console.error("Password reset email failed:", error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const user = await User.findOne({ passwordResetToken: hashToken(token), passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires");
  if (!user) throw ApiError.badRequest("This reset link is invalid or has expired");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}

export async function changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordInput) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw ApiError.unauthorized();
  if (!(await user.comparePassword(currentPassword))) throw ApiError.badRequest("Current password is incorrect", [{ field: "currentPassword", message: "Current password is incorrect" }]);
  if (currentPassword === newPassword) throw ApiError.badRequest("New password must be different from the current one");
  user.password = newPassword;
  await user.save();
  return { user, token: signToken({ id: user.id, role: user.role }) }; // old tokens are now invalid; issue a fresh one
}

/**
 * Creates a fresh confirmation link and emails it. Only the hash of the token is stored.
 * Confirming the email is encouraged but does not block login or checkout. Never throws.
 */
export async function issueEmailVerification(userId: string): Promise<void> {
  try {
    const user = await User.findById(userId);
    if (!user || user.isEmailVerified) return;
    const rawToken = randomBytes(32).toString("hex");
    user.emailVerificationToken = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + VERIFY_TOKEN_HOURS * 3600 * 1000);
    await user.save();
    sendEmailInBackground(toMessage(user.email, verifyEmailEmail(user.name, `${env.CLIENT_URL}/auth/verify-email?token=${rawToken}`)), "verify email");
  } catch (error) {
    console.error("Could not create an email confirmation link:", error);
  }
}

/** Resend for a signed-in customer. Says so when there is nothing to confirm. */
export async function resendEmailVerification(userId: string): Promise<{ alreadyVerified: boolean }> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized();
  if (user.isEmailVerified) return { alreadyVerified: true };
  await issueEmailVerification(userId);
  return { alreadyVerified: false };
}

/**
 * Confirms an email from the link. Opening the link twice is fine (mail scanners and double clicks happen):
 * the token stays valid until it expires and the second visit just reports that the email is already confirmed.
 */
export async function verifyEmail(token: string): Promise<{ alreadyVerified: boolean }> {
  const user = await User.findOne({ emailVerificationToken: hashToken(token), emailVerificationExpires: { $gt: new Date() } }).select("+emailVerificationToken +emailVerificationExpires");
  if (!user) throw ApiError.badRequest("This confirmation link is invalid or has expired. Log in and ask for a new one.");
  if (user.isEmailVerified) return { alreadyVerified: true };
  // One atomic flip decides which request sends the welcome email
  const flipped = await User.updateOne({ _id: user._id, isEmailVerified: false }, { isEmailVerified: true });
  if (flipped.modifiedCount === 1) sendEmailInBackground(toMessage(user.email, welcomeEmail(user.name)), "welcome");
  return { alreadyVerified: flipped.modifiedCount !== 1 };
}
