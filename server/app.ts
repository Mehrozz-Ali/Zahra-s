import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env";
import { stripeWebhook } from "./controllers/payment.controller";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { originGuard } from "./middleware/originGuard";
import { apiLimiter } from "./middleware/rateLimiter";
import { sanitizeInput } from "./middleware/sanitize";
import routes from "./routes";

export function createApp(): Express {
  const app = express();

  if (isProduction) app.set("trust proxy", 1); // behind nginx / load balancer on EC2

  // This server only returns JSON, so it needs no scripts, styles or frames of its own
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, referrerPolicy: { policy: "no-referrer" } }));
  app.use(cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600, // browsers may cache the preflight answer for 10 minutes
  }));
  app.use(morgan(isProduction ? "combined" : "dev"));
  // Stripe signs the exact bytes it sends, so this route must come BEFORE express.json()
  app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);
  // JSON only: accepting HTML-form encodings would let another website submit forms to this API
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());
  app.use(originGuard(env.CLIENT_ORIGINS)); // CSRF: state-changing requests must come from our own website
  app.use(sanitizeInput); // strips MongoDB operators ($...) from input

  app.use("/api/v1", apiLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
