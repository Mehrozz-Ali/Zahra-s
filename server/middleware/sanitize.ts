import type { RequestHandler } from "express";

/**
 * Stops MongoDB operator injection. A request such as {"email": {"$ne": ""}} or ?status[$ne]=x tries to smuggle a
 * query operator in as a value. Any key that starts with "$" or contains "." is removed, at any depth, from the body,
 * query string and URL parameters before anything else sees it. Validation then rejects what is left if it is wrong.
 */
function clean(value: unknown, depth = 0): void {
  if (value === null || typeof value !== "object" || depth > 12) return;
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key.startsWith("$") || key.includes(".")) delete record[key];
    else clean(record[key], depth + 1);
  }
}

export const sanitizeInput: RequestHandler = (req, _res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};
