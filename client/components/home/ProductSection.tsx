import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

interface ProductSectionProps {
  title: string;
  eyebrow?: string;
  href: string;
  products: Product[];
  tinted?: boolean;
}

/** Renders nothing when empty, so a new store never shows hollow sections. */
export function ProductSection({ title, eyebrow, href, products, tinted }: ProductSectionProps) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={`${title}-heading`.replace(/\s+/g, "-")} className={tinted ? "bg-sand/40" : undefined}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            {eyebrow && <p className="mb-1 text-xs uppercase tracking-widest text-rose-dark">{eyebrow}</p>}
            <h2 id={`${title}-heading`.replace(/\s+/g, "-")} className="font-display text-4xl sm:text-5xl">{title}</h2>
          </div>
          <Link href={href} className="shrink-0 text-sm underline underline-offset-4 hover:text-rose-dark">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
