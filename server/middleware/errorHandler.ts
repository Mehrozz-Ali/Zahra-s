import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import { ZodError } from "zod";
import { isProduction } from "../config/env";
import type { ApiFailure } from "../types";
import { ApiError, type ApiErrorDetail } from "../utils/ApiError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

interface MongoDuplicateError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKey = (err: unknown): err is MongoDuplicateError =>
  err instanceof Error && (err as MongoDuplicateError).code === 11000;

/** Errors raised by Express's body reader (malformed JSON, oversized body): the client's mistake, not ours. */
interface BodyParserError extends Error { status: number; type?: string }
const isBodyParserError = (err: unknown): err is BodyParserError =>
  err instanceof Error && typeof (err as BodyParserError).status === "number" && (err as BodyParserError).status >= 400 && (err as BodyParserError).status < 500;

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  let status = 500;
  let message = "Something went wrong on our side. Please try again.";
  let errors: ApiErrorDetail[] = [];

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof Stripe.errors.StripeError) {
    status = 502;
    message = "The payment service had a problem. Please try again.";
  } else if (isBodyParserError(err)) {
    status = err.status;
    message = err.type === "entity.too.large" ? "The request is too large" : err.type === "entity.parse.failed" ? "The request body is not valid JSON" : "The request could not be read";
  } else if (isDuplicateKey(err)) {
    status = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    message = `A record with this ${field} already exists`;
    errors = [{ field, message }];
  }

  if (status >= 500) console.error(err);

  const body: ApiFailure & { stack?: string } = { success: false, message, errors };
  if (!isProduction && err instanceof Error && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
};
