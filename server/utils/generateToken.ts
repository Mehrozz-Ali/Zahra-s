import type { Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env, isProduction } from "../config/env";
import type { AuthTokenPayload } from "../types";

export const COOKIE_NAME = "token";

export const signToken = (payload: Pick<AuthTokenPayload, "id" | "role">): string =>
  jwt.sign(payload, env.JWT_SECRET, { algorithm: "HS256", expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }); // never accept "none" or another algorithm
  if (typeof decoded === "string" || typeof decoded.id !== "string" || (decoded.role !== "customer" && decoded.role !== "admin")) {
    throw new Error("Malformed token");
  }
  return { id: decoded.id, role: decoded.role, iat: decoded.iat };
}

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // Vercel and EC2 are different sites in production, so the cookie must be SameSite=None (requires Secure)
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export function setAuthCookie(res: Response, token: string): void {
  const exp = (jwt.decode(token) as { exp: number }).exp;
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: exp * 1000 - Date.now() });
}

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
};
