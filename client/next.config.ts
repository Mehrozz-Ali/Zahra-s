import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/** Pages that are private or only make sense mid-purchase. robots.txt asks crawlers to skip them; this header tells them not to index them even if they find a link. */
const NOINDEX = ["/admin/:path*", "/account/:path*", "/auth/:path*", "/cart", "/checkout/:path*", "/wishlist"];

/** The API address the browser is allowed to talk to. */
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").origin;
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy: the browser refuses to load scripts, frames or connections from anywhere not listed here,
 * which limits what an injected script could do. Only in production, because the development server needs eval().
 * 'unsafe-inline' for scripts is required by Next.js's own inline bootstrap code (a nonce-based policy would make every page dynamic).
 * Stripe's hosts are the ones Stripe documents for Stripe.js and the Payment Element.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.stripe.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://api.stripe.com https://r.stripe.com https://m.stripe.network`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // nobody can put this site inside a frame (clickjacking)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProduction
    ? [
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...NOINDEX.map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
    ];
  },
};

export default nextConfig;
