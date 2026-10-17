import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const originOf = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return value; // e.g. the literal string "null" that browsers send from sandboxed contexts: it will not match
  }
};

/**
 * CSRF protection. In production the website and the API are on different sites, so the login cookie is sent with
 * cross-site requests (SameSite=None). Without this guard another website could make a logged-in customer's browser
 * submit a form to this API. Browsers always add an Origin header to cross-site POST/PUT/PATCH/DELETE requests, so
 * a state-changing request must come from our own website. Requests with no Origin (curl, server-to-server) have no
 * browser cookie to abuse and pass. The Stripe webhook is registered before this and is checked by its signature instead.
 */
export const originGuard = (allowedOrigins: string[]): RequestHandler => {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = originOf(req.get("origin")) ?? originOf(req.get("referer"));
    if (origin === undefined || allowed.has(origin)) return next();
    next(ApiError.forbidden("This request was blocked because it did not come from our website"));
  };
};
