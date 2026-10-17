import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Keep private and transactional pages out of search results. They are also sent with a noindex header (see next.config.ts). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/auth", "/cart", "/checkout", "/wishlist"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
