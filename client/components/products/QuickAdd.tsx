"use client";

import clsx from "clsx";
import { Check, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { MAX_CART_QTY } from "@/lib/constants";
import { addItem } from "@/store/slices/cartSlice";
import type { Product, Size } from "@/types";

/**
 * Cart icon on a product picture, right below the wishlist heart. A suit needs a size, so the icon opens a small size picker on the picture;
 * tapping a size adds one to the cart. With only one size in stock it adds straight away.
 * It sits over the picture (the parent is relative and has the picture's aspect ratio) without being inside the product link.
 */
export function QuickAdd({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState<Size | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const available = product.sizes.filter((s) => s.stock > 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open]);

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => { setAdded(null); setOpen(false); }, 2200);
    return () => window.clearTimeout(t);
  }, [added]);

  if (available.length === 0) return null; // sold out everywhere

  const add = (size: Size, stock: number) => {
    const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
    dispatch(addItem({ productId: product._id, slug: product.slug, name: product.name, image: image?.url, size, unitPrice: product.finalPrice, quantity: 1, maxQuantity: Math.min(stock, MAX_CART_QTY) }));
    setAdded(size);
    setOpen(true);
  };

  const onIconClick = () => {
    const only = available.length === 1 ? available[0] : undefined;
    if (only) add(only.size, only.stock);
    else setOpen((o) => !o);
  };

  return (
    <div ref={root} className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4]">
      <button
        type="button"
        onClick={onIconClick}
        aria-label={`Add ${product.name} to cart`}
        aria-expanded={available.length > 1 ? open : undefined}
        title="Add to cart"
        className={clsx("pointer-events-auto absolute right-2 top-[3.25rem] flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory shadow-sm transition-colors hover:bg-rose-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2", open && "hidden")}
      >
        {added ? <Check className="h-4 w-4" aria-hidden /> : <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />}
      </button>

      {open && (
        <div role="dialog" aria-label={`Choose a size for ${product.name}`} className="pointer-events-auto absolute inset-x-0 bottom-0 bg-ivory/95 p-3 backdrop-blur-sm">
          {added ? (
            <p role="status" className="flex items-center justify-between gap-2 text-sm">
              <span>Size {added} added</span>
              <Link href="/cart" className="font-medium underline underline-offset-4">View cart</Link>
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-stone">
                <span>Select size</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close size picker" className="-mr-1 flex h-7 w-7 items-center justify-center hover:text-ink"><X className="h-4 w-4" aria-hidden /></button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.stock === 0}
                    onClick={() => add(s.size, s.stock)}
                    aria-label={`Size ${s.size}${s.stock === 0 ? " (sold out)" : ""}`}
                    className={clsx("h-9 min-w-9 border px-2 text-sm", s.stock === 0 ? "cursor-not-allowed border-sand text-stone/40 line-through" : "border-ink bg-white hover:bg-ink hover:text-ivory")}
                  >{s.size}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
