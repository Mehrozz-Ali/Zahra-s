import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

/** Use after `protect`: router.use(protect, adminOnly) */
export const adminOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role === "admin") return next();
  next(ApiError.forbidden("Admin access required"));
};
