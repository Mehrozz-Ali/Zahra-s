"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { useAddToWishlistMutation } from "@/services/wishlistApi";
import { useGetCartPricingQuery } from "@/services/cartApi";
import { applyPricing, removeItem, setQuantity } from "@/store/slices/cartSlice";

export function CartView() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [addToWishlist] = useAddToWishlistMutation();
  const [notice, setNotice] = useState<string | null>(null);

  /** Saves the article to the wishlist, then takes the line out of the cart. Guests log in first. */
  const moveToWishlist = async (line: { productId: string; size: typeof items[number]["size"] }) => {
    if (!isAuthenticated) return router.push("/auth/login?redirect=/cart");
    try {
      await addToWishlist(line.productId).unwrap();
      dispatch(removeItem({ productId: line.productId, size: line.size }));
      setNotice("Moved to your wishlist.");
    } catch (e) {
      setNotice(getErrorMessage(e));
    }
  };

  const lines = useMemo(() => items.map(({ productId, size, quantity }) => ({ productId, size, quantity })), [items]);
  const { data, isFetching, isError, refetch } = useGetCartPricingQuery(lines, { skip: lines.length === 0 });

  // Apply live prices and stock from the server; tell the customer if something changed
  useEffect(() => {
    if (!data) return;
    dispatch(applyPricing(data.items));
    const changed = data.items.filter((i) => i.available && i.issue).map((i) => i.issue);
    if (changed.length > 0) setNotice(`Some items were updated because stock changed. ${changed[0]}.`);
  }, [data, dispatch]);

  if (!hydrated) {
    return <div role="status" aria-label="Loading your cart" className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6 motion-reduce:animate-none"><div className="h-10 w-48 bg-sand" /><div className="mt-8 h-64 bg-sand/60" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <ShoppingBag className="h-12 w-12 text-sand" aria-hidden />
        <h1 className="mt-4 font-display text-5xl">Your cart is empty</h1>
        <p className="mb-8 mt-2 text-stone">Looks like you have not added anything yet.</p>
        <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Continue shopping</Link>
      </div>
    );
  }

  const priced = (i: number) => (data && data.items.length === items.length ? data.items[i] : undefined); // same order as the request
  const hasProblem = data?.items.some((i) => !i.available) ?? false;
  const canCheckout = Boolean(data) && !isError && !hasProblem && !isFetching;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-5xl">Your cart</h1>
      {notice && (
        <p role="status" className="mt-4 flex items-start justify-between gap-4 bg-sand/60 p-4 text-sm">
          {notice}
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline underline-offset-4">Dismiss</button>
        </p>
      )}
      {isError && (
        <p role="alert" className="mt-4 bg-red-50 p-4 text-sm text-red-800">
          We could not confirm current prices and stock. <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button>
        </p>
      )}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-sand border-y border-sand">
          {items.map((line, i) => (
            <CartLineItem
              key={`${line.productId}|${line.size}`}
              line={line}
              priced={priced(i)}
              onQuantity={(quantity) => dispatch(setQuantity({ productId: line.productId, size: line.size, quantity }))}
              onRemove={() => dispatch(removeItem({ productId: line.productId, size: line.size }))}
              onMoveToWishlist={() => moveToWishlist(line)}
            />
          ))}
        </ul>
        <OrderSummary summary={data?.summary} updating={isFetching} canCheckout={canCheckout} />
      </div>
      <p className="mt-8"><Link href="/shop" className="text-sm underline underline-offset-4 hover:text-rose-dark">Continue shopping</Link></p>
    </div>
  );
}
