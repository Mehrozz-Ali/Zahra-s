import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

export function Hero({ product }: { product?: Product }) {
  const image = product ? (product.images.find((i) => i.isPrimary) ?? product.images[0]) : undefined;
  return (
    <section className="bg-sand/50">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-rose-dark">Discover your style</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-7xl">New Season Collection</h1>
          <p className="mb-8 mt-5 max-w-md text-lg text-stone">Explore our latest women&apos;s collection.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory transition-colors hover:bg-rose-dark">Shop now</Link>
            <Link href="/category/new-arrivals" className="border border-ink px-8 py-3.5 text-sm uppercase tracking-widest transition-colors hover:bg-ink hover:text-ivory">View collection</Link>
          </div>
        </div>
        {image && product && (
          <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-sand" aria-label={`View ${product.name}`}>
            <Image src={image.url} alt={product.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </Link>
        )}
      </div>
    </section>
  );
}
