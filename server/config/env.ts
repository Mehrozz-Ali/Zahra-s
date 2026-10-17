import "dotenv/config";
import { z } from "zod";

const optionalString = z.string().optional().default("");

const schema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // One address, or several separated by commas (for example your domain with and without www)
  CLIENT_URL: z.string().min(1).default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_CURRENCY: z.string().trim().toLowerCase().default("pkr"),
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,
  // Only if `mongodb+srv://` fails with "querySrv ECONNREFUSED": DNS servers to use for the database lookup, e.g. 8.8.8.8,1.1.1.1
  MONGODB_DNS_SERVERS: optionalString,
  REDIS_URL: optionalString,
  ADMIN_EMAIL: optionalString,
  ADMIN_PASSWORD: optionalString,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment variables:\n${problems}`);
  process.exit(1);
}

// Normalise the website addresses to plain origins (no path, no trailing slash): a stray "/" would otherwise make every browser request fail CORS
const clientOrigins = parsed.data.CLIENT_URL.split(",").map((u) => u.trim()).filter(Boolean).map((u) => {
  try {
    return new URL(u).origin;
  } catch {
    console.error(`Invalid environment variables:\n  - CLIENT_URL: "${u}" is not a valid address (use something like https://www.example.com)`);
    process.exit(1);
  }
});

export const env = { ...parsed.data, CLIENT_URL: clientOrigins[0]!, CLIENT_ORIGINS: clientOrigins };
export const isProduction = env.NODE_ENV === "production";

/** Settings that are fine on a laptop but dangerous or broken on a real server. Problems stop the server; the rest are warnings. */
if (isProduction) {
  const problems: string[] = [];
  if (/replace-with|change-?me/i.test(env.JWT_SECRET)) problems.push("JWT_SECRET still looks like a placeholder. Generate a long random value.");
  if (env.CLIENT_ORIGINS.some((o) => !o.startsWith("https://"))) problems.push("CLIENT_URL must use https:// in production, or login cookies will not work.");
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) problems.push("STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set; without it paid orders can never be confirmed.");
  if (problems.length > 0) {
    console.error(`Unsafe production configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  if (!env.SMTP_HOST) console.warn("Warning: SMTP is not configured, so no emails (order updates, password resets) will be sent.");
  if (env.STRIPE_SECRET_KEY.startsWith("sk_test")) console.warn("Warning: Stripe is using a TEST key in production.");
}
