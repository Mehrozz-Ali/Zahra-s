"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { useGetWishlistQuery } from "@/services/wishlistApi";

function Content() {
  const { data, isLoading, isError, refetch } = useGetWishlistQuery();

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading your wishlist" className="grid animate-pulse grid-cols-2 gap-6 lg:grid-cols-4 motion-reduce:animate-none">
        {[0, 1, 2, 3].map((n) => <div key={n} className="aspect-[3/4] bg-sand" />)}
      </div>
    );
  }
  if (isError) {
    return <p role="alert" className="bg-red-50 p-4 text-sm text-red-800">We could not load your wishlist. <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Heart className="h-12 w-12 text-sand" aria-hidden />
        <h2 className="mt-4 font-display text-4xl">Your wishlist is empty</h2>
        <p className="mb-8 mt-2 text-stone">Tap the heart on any item to save it for later.</p>
        <Link href="/shop" className="bg-ink px-8 py-3.5 text-sm uppercase tracking-widest text-ivory hover:bg-rose-dark">Browse the shop</Link>
      </div>
    );
  }
  return (
    <>
      <p className="mb-6 text-stone">{data.length} saved item{data.length === 1 ? "" : "s"}</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{data.map((item) => <WishlistCard key={item.product._id} item={item} />)}</ul>
    </>
  );
}

export function WishlistView() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 font-display text-5xl">Wishlist</h1>
        <Content />
      </div>
    </AuthGuard>
  );
}
