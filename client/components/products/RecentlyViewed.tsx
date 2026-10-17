"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { useGetProductsQuery } from "@/services/productApi";

const KEY = "recent:v1";
const MAX_STORED = 10;
const MAX_SHOWN = 4;

/** Remembers viewed products in this browser only. Shows the latest few, excluding the one on screen. */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    let stored: string[] = [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(parsed)) stored = parsed.filter((s): s is string => typeof s === "string");
    } catch { /* ignore a corrupted list */ }
    const next = [currentSlug, ...stored.filter((s) => s !== currentSlug)].slice(0, MAX_STORED);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    setSlugs(next.filter((s) => s !== currentSlug).slice(0, MAX_SHOWN));
  }, [currentSlug]);

  const { data } = useGetProductsQuery({ slugs: slugs.join(","), limit: MAX_SHOWN }, { skip: slugs.length === 0 });
  const products = slugs.flatMap((s) => data?.products.find((p) => p.slug === s) ?? []); // keep most-recent-first order
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="py-12">
      <h2 id="recent-heading" className="mb-8 font-display text-4xl">Recently viewed</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
    </section>
  );
}
