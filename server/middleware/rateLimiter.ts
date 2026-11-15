import rateLimit from "express-rate-limit";

const limitMessage = (message: string) => ({ success: false, message, errors: [] });

// Browsing is generous on purpose: on mobile networks in Pakistan many phones share one IP address.
// Login, sign-up, ordering and order tracking have their own, much stricter limits below.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many requests. Please try again in a few minutes."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many attempts. Please try again later."),
});

/** Guest order lookup: strict, so order numbers cannot be guessed. */
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many lookups. Please try again in a few minutes."),
});

export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many order attempts. Please wait a few minutes and try again."),
});

const emailKey = (req: { body?: unknown }): string => {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email.trim().toLowerCase().slice(0, 200) : "";
};

/**
 * Slows password guessing. Failed logins are counted per address AND per account, so neither one computer
 * hammering many accounts nor many computers hammering one account gets through. Successful logins are not counted.
 */
export const loginLimiter = [
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, skipSuccessfulRequests: true, standardHeaders: "draft-7", legacyHeaders: false, message: limitMessage("Too many failed logins. Please wait 15 minutes and try again."),
    keyGenerator: (req) => `${req.ip ?? ""}|${emailKey(req)}` }),
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 25, skipSuccessfulRequests: true, standardHeaders: "draft-7", legacyHeaders: false, message: limitMessage("Too many failed logins for this account. Please try again later or reset your password."),
    keyGenerator: (req) => `acct|${emailKey(req) || (req.ip ?? "")}` }),
];

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many accounts were created from this connection. Please try again later."),
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage("Too many uploads. Please wait a few minutes and try again."),
});
