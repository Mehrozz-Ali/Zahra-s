import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/store/slices/cartSlice";
import type { PricedLine } from "@/types";
import { Heart, Trash2 } from "lucide-react";

interface CartLineItemProps {
  line: CartLine;
  priced?: PricedLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onMoveToWishlist: () => void;
}

export function CartLineItem({ line, priced, onQuantity, onRemove, onMoveToWishlist }: CartLineItemProps) {
  const unavailable = priced?.available === false;
  const unitPrice = priced?.unitPrice || line.unitPrice;
  const maxQuantity = priced?.available ? priced.maxQuantity : line.maxQuantity;

  return (
    <li className={clsx("flex gap-3 py-5 sm:gap-4 sm:py-6", unavailable && "opacity-70")}>
      <Link href={`/product/${line.slug}`} className="relative block h-32 w-24 shrink-0 overflow-hidden bg-sand sm:h-40 sm:w-32 [@media(max-width:380px)]:h-28 [@media(max-width:380px)]:w-20">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="128px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} className="line-clamp-2 font-medium hover:text-rose-dark">{line.name}</Link>
            <p className="mt-1 text-sm text-stone">Size {line.size}</p>
            <p className="mt-1 text-sm">{formatPrice(unitPrice)}</p>
          </div>
          <p className="shrink-0 font-medium">{unavailable ? "-" : formatPrice(unitPrice * line.quantity)}</p>
        </div>

        {priced?.issue && <p role="alert" className="mt-2 text-sm text-rose-dark">{priced.issue}</p>}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3">
          {unavailable ? (
            <span className="text-sm text-stone">Remove this item to continue</span>
          ) : (
            <div role="group" aria-label={`Quantity for ${line.name}`} className="inline-flex items-center border border-sand bg-white">
              <button type="button" onClick={() => onQuantity(line.quantity - 1)} disabled={line.quantity <= 1} aria-label="Decrease quantity" className="h-10 w-10 disabled:opacity-40">&minus;</button>
              <output aria-live="polite" className="w-8 text-center text-sm">{line.quantity}</output>
              <button type="button" onClick={() => onQuantity(line.quantity + 1)} disabled={line.quantity >= maxQuantity} aria-label="Increase quantity" className="h-10 w-10 disabled:opacity-40">+</button>
            </div>
          )}
          <span className="flex shrink-0 items-center">
            <button type="button" onClick={onMoveToWishlist} aria-label={`Move ${line.name} to wishlist`} title="Move to wishlist" className="flex h-11 w-11 items-center justify-center hover:text-rose-dark"><Heart className="h-5 w-5" aria-hidden /></button>
            <button type="button" onClick={onRemove} aria-label={`Remove ${line.name} from cart`} title="Remove" className="flex h-11 w-11 items-center justify-center text-red-800 hover:text-red-950"><Trash2 className="h-5 w-5" aria-hidden /></button>
          </span>
        </div>
      </div>
    </li>
  );
}
