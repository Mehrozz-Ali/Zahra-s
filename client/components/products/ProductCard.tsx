import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const hover = product.images.find((i) => i !== primary);
  const sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          {primary && <Image src={primary.url} alt={product.name} fill sizes={sizes} priority={priority} className="object-cover" />}
          {hover && <Image src={hover.url} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
          <div className="absolute left-2 top-2 flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wider">
            {product.discountPercentage > 0 && <span className="bg-rose-dark px-2 py-0.5 text-ivory">-{product.discountPercentage}%</span>}
            {product.newArrival && <span className="bg-ink px-2 py-0.5 text-ivory">New</span>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-1 text-sm font-medium">{product.name}</h3>
        <p className="text-xs text-stone">{product.category.name}</p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-medium">{formatPrice(product.finalPrice)}</span>
          {product.discountPrice !== undefined && <span className="text-stone line-through">{formatPrice(product.price)}</span>}
        </p>
        {product.numReviews > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-stone">
            <Star className="h-3.5 w-3.5 fill-current text-rose" aria-hidden /> <span className="sr-only">Rated </span>{product.rating.toFixed(1)} ({product.numReviews})
          </p>
        )}
      </Link>
      <WishlistButton productId={product._id} productName={product.name} className="absolute right-2 top-2" />
    </article>
  );
}
