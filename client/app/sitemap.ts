import type { MetadataRoute } from "next";
import { getAllProductEntries, getCategories } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

// Read fresh each time so a newly published article is listed without a rebuild
export const dynamic = "force-dynamic";

const STATIC: Array<{ path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/return-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getAllProductEntries()]);
  return [
    ...STATIC.map((s) => ({ url: absoluteUrl(s.path), changeFrequency: s.changeFrequency, priority: s.priority })),
    ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
    ...(products ?? []).map((p) => ({ url: absoluteUrl(`/product/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
