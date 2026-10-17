"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { useWishlistToggle } from "@/hooks/useWishlist";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  variant?: "icon" | "inline";
  className?: string;
}

export function WishlistButton({ productId, productName, variant = "icon", className }: WishlistButtonProps) {
  const { isWishlisted, toggle, isBusy, error } = useWishlistToggle(productId);
  // Icon-only button: the label stays the same and aria-pressed carries the state, so it is not announced twice
  const label = `Wishlist: ${productName}`;
  const heart = <Heart className={clsx("h-5 w-5", isWishlisted && "fill-rose-dark text-rose-dark")} aria-hidden />;

  if (variant === "inline") {
    return (
      <div className={className}>
        <button type="button" onClick={toggle} disabled={isBusy} className="inline-flex items-center gap-2 text-sm hover:text-rose-dark disabled:opacity-60">
          {heart} {isWishlisted ? "Saved to wishlist" : "Add to wishlist"}<span className="sr-only">: {productName}</span>
        </button>
        {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
      </div>
    );
  }
  return (
    <button type="button" onClick={toggle} disabled={isBusy} aria-pressed={isWishlisted} aria-label={label} title={error || undefined}
      className={clsx("flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 shadow-sm transition-colors hover:bg-white disabled:opacity-60", className)}>
      {heart}
    </button>
  );
}
