"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { useAddToWishlistMutation, useGetWishlistIdsQuery, useRemoveFromWishlistMutation } from "@/services/wishlistApi";

/** Saved ids for the logged-in customer. All hearts on a page share one request. */
export function useWishlistIds() {
  const { isAuthenticated } = useAuth();
  const { data } = useGetWishlistIdsQuery(undefined, { skip: !isAuthenticated });
  return isAuthenticated ? (data ?? []) : [];
}

/** Heart state and toggle for one article. Guests are sent to log in first, then brought back. */
export function useWishlistToggle(productId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const ids = useWishlistIds();
  const [add, { isLoading: adding }] = useAddToWishlistMutation();
  const [remove, { isLoading: removing }] = useRemoveFromWishlistMutation();
  const [error, setError] = useState("");
  const isWishlisted = ids.includes(productId);

  const toggle = async () => {
    setError("");
    if (!isAuthenticated) return router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    try {
      await (isWishlisted ? remove(productId) : add(productId)).unwrap();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return { isWishlisted, toggle, isBusy: adding || removing, error };
}
