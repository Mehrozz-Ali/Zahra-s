import type { Response } from "express";
import type { ApiSuccess } from "../types";

export function sendSuccess<T>(res: Response, data: T, message = "Success", statusCode = 200): Response<ApiSuccess<T>> {
  return res.status(statusCode).json({ success: true, message, data });
}
