"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useRemoveFromWishlistMutation } from "@/services/wishlistApi";
import { addItem } from "@/store/slices/cartSlice";
import type { WishlistItem } from "@/types";
import { Trash2 } from "lucide-react";

export function WishlistCard({ item }: { item: WishlistItem }) {
  const { product, available } = item;
  const dispatch = useAppDispatch();
  const [remove, { isLoading: removing }] = useRemoveFromWishlistMutation();
  const [error, setError] = useState("");
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];

  // Every size that is in stock
  const options = product.sizes.filter((s) => s.stock > 0);
  const onlyOption = options.length === 1 ? options[0] : undefined;

  const removeItem = async () => {
    setError("");
    try { await remove(product._id).unwrap(); } catch (e) { setError(getErrorMessage(e)); }
  };

  /** One size left: move it straight to the cart. Otherwise the customer picks on the product page. */
  const moveToCart = async () => {
    if (!onlyOption) return;
    dispatch(addItem({
      productId: product._id, slug: product.slug, name: product.name, image: image?.url, size: onlyOption.size,
      unitPrice: product.finalPrice, quantity: 1, maxQuantity: Math.min(onlyOption.stock, 10),
    }));
    await removeItem();
  };

  return (
    <li className={clsx("flex flex-col", !available && "opacity-70")}>
      <Link href={available ? `/product/${product.slug}` : "#"} aria-disabled={!available} tabIndex={available ? undefined : -1} className="relative block aspect-[3/4] overflow-hidden bg-sand">
        {image && <Image src={image.url} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />}
        {!available && <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-xs uppercase tracking-widest text-ivory">No longer available</span>}
      </Link>
      <h3 className="mt-3 line-clamp-1 text-sm font-medium">{product.name}</h3>
      <p className="text-sm">{formatPrice(product.finalPrice)}{product.discountPrice !== undefined && <span className="ml-2 text-stone line-through">{formatPrice(product.price)}</span>}</p>

      <div className="mt-3 flex flex-col gap-2">
        {available && (onlyOption ? (
          <button type="button" onClick={moveToCart} disabled={removing} className="h-10 bg-ink text-xs uppercase tracking-widest text-ivory hover:bg-rose-dark disabled:opacity-60">Move to cart</button>
        ) : options.length > 1 ? (
          <Link href={`/product/${product.slug}`} className="flex h-10 items-center justify-center bg-ink text-xs uppercase tracking-widest text-ivory hover:bg-rose-dark">Choose a size</Link>
        ) : (
          <span className="flex h-10 items-center justify-center border border-sand text-xs uppercase tracking-widest text-stone">Sold out</span>
        ))}
        <button type="button" onClick={removeItem} disabled={removing} aria-label={`Remove ${product.name} from wishlist`} className="inline-flex items-center justify-center gap-1.5 text-sm text-red-800 underline underline-offset-4 disabled:opacity-60"><Trash2 className="h-4 w-4" aria-hidden />Remove</button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </li>
  );
}
