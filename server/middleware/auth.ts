import type { Request } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { COOKIE_NAME, verifyToken } from "../utils/generateToken";

/** Requires a valid login cookie. Sets req.user = { id, role }. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string" || token === "") throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }

  const user = await User.findById(payload.id).select("role isActive passwordChangedAt");
  if (!user) throw ApiError.unauthorized();
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated");
  if (user.passwordChangedAt && payload.iat !== undefined && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
    throw ApiError.unauthorized("Your password was changed. Please log in again.");
  }

  req.user = { id: user.id, role: user.role };
  next();
});

/** Use inside controllers that sit behind `protect`. */
export function getAuthUser(req: Request): NonNullable<Request["user"]> {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
