import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

/** List-view layout for the shop page. */
export function ProductRow({ product }: { product: Product }) {
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  return (
    <article className="relative flex gap-5 border-b border-sand py-5">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] w-28 shrink-0 bg-sand sm:w-40">
        {image && <Image src={image.url} alt={product.name} fill sizes="160px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-xs text-stone">{product.category.name}</p>
        <h3 className="font-medium"><Link href={`/product/${product.slug}`} className="hover:text-rose-dark">{product.name}</Link></h3>
        {product.shortDescription && <p className="line-clamp-2 text-sm text-stone">{product.shortDescription}</p>}
        <p className="flex items-center gap-2 text-sm">
          <span className="font-medium">{formatPrice(product.finalPrice)}</span>
          {product.discountPrice !== undefined && <><span className="text-stone line-through">{formatPrice(product.price)}</span><span className="text-rose-dark">-{product.discountPercentage}%</span></>}
        </p>
        <p className="mt-1 text-xs text-stone">Sizes: {product.sizes.filter((s) => s.stock > 0).map((s) => s.size).join(", ") || "sold out"}</p>
      </div>
      <WishlistButton productId={product._id} productName={product.name} variant="inline" className="absolute right-0 top-5" />
    </article>
  );
}
