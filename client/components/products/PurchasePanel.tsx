"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SizeGuide } from "@/components/products/SizeGuide";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { useAppDispatch } from "@/hooks/redux";
import { LOW_STOCK_THRESHOLD, MAX_CART_QTY } from "@/lib/constants";
import { addItem, type CartLine } from "@/store/slices/cartSlice";
import type { Product, Size } from "@/types";

export function PurchasePanel({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [size, setSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const stock = size ? (product.sizes.find((s) => s.size === size)?.stock ?? 0) : 0;
  const maxQuantity = Math.min(stock, MAX_CART_QTY);

  const chooseSize = (s: Size) => {
    setSize(s);
    setQuantity(1);
    setMessage(null);
  };

  /** Returns the cart line if the selection is complete, otherwise shows what is missing. */
  const buildLine = (): CartLine | null => {
    if (!size) return setMessage({ ok: false, text: "Please choose a size" }), null;
    if (maxQuantity < 1) return setMessage({ ok: false, text: "This size is sold out" }), null;
    const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
    return { productId: product._id, slug: product.slug, name: product.name, image: image?.url, size, unitPrice: product.finalPrice, quantity, maxQuantity };
  };

  const addToCart = () => {
    const line = buildLine();
    if (!line) return;
    dispatch(addItem(line));
    setMessage({ ok: true, text: "Added to your cart" });
  };
  const buyNow = () => {
    const line = buildLine();
    if (!line) return;
    dispatch(addItem(line));
    router.push("/checkout");
  };

  const stockText = !size ? null : stock === 0 ? "Sold out in this size" : stock <= LOW_STOCK_THRESHOLD ? `Only ${stock} left` : "In stock";
  const soldOutEverywhere = product.sizes.every((s) => s.stock === 0);

  return (
    <div className="space-y-6 border-y border-sand py-6">
      <fieldset>
        <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium"><span>Size{size && <span className="font-normal text-stone">: {size}</span>}</span><SizeGuide /></legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button key={s.size} type="button" disabled={s.stock === 0} onClick={() => chooseSize(s.size)} aria-pressed={s.size === size} aria-label={`Size ${s.size}${s.stock === 0 ? " (sold out)" : ""}`}
              className={clsx("h-11 min-w-11 border px-3 text-sm disabled:cursor-not-allowed disabled:text-stone/40 disabled:line-through", s.size === size ? "border-ink bg-ink text-ivory" : "border-sand bg-white hover:border-ink")}>{s.size}</button>
          ))}
        </div>
        {stockText && <p role="status" className={clsx("mt-2 text-sm", stock === 0 || stock <= LOW_STOCK_THRESHOLD ? "text-rose-dark" : "text-green-800")}>{stockText}</p>}
      </fieldset>

      <div>
        <p id="qty-label" className="mb-2 text-sm font-medium">Quantity</p>
        <div role="group" aria-labelledby="qty-label" className="inline-flex items-center border border-sand bg-white">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="h-11 w-11 text-lg disabled:opacity-40">&minus;</button>
          <output aria-live="polite" className="w-10 text-center">{quantity}</output>
          <button type="button" onClick={() => setQuantity((q) => Math.min(Math.max(maxQuantity, 1), q + 1))} disabled={quantity >= maxQuantity} aria-label="Increase quantity" className="h-11 w-11 text-lg disabled:opacity-40">+</button>
        </div>
      </div>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={clsx("text-sm", message.ok ? "text-green-800" : "text-red-700")}>
          {message.text}{message.ok && <> &middot; <Link href="/cart" className="underline underline-offset-4">View cart</Link></>}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={addToCart} disabled={soldOutEverywhere}>{soldOutEverywhere ? "Sold out" : "Add to cart"}</Button>
        <Button type="button" variant="outline" onClick={buyNow} disabled={soldOutEverywhere}>Buy now</Button>
      </div>
      <WishlistButton productId={product._id} productName={product.name} variant="inline" />
    </div>
  );
}
