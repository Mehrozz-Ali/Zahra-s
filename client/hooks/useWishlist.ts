"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { addGuestWishlist, getGuestWishlist, getGuestWishlistServer, removeGuestWishlist, subscribeGuestWishlist } from "@/lib/guestWishlist";
import { useAddToWishlistMutation, useGetWishlistIdsQuery, useRemoveFromWishlistMutation } from "@/services/wishlistApi";

/** Saved ids: the account's list when logged in, otherwise the one kept in this browser. All hearts on a page share one request. */
export function useWishlistIds() {
  const { isAuthenticated } = useAuth();
  const { data } = useGetWishlistIdsQuery(undefined, { skip: !isAuthenticated });
  const guestIds = useSyncExternalStore(subscribeGuestWishlist, getGuestWishlist, getGuestWishlistServer);
  return isAuthenticated ? (data ?? []) : guestIds;
}

/** Add/remove for one article, for both guests and customers. No login needed. */
export function useWishlistActions() {
  const { isAuthenticated } = useAuth();
  const [add, { isLoading: adding }] = useAddToWishlistMutation();
  const [remove, { isLoading: removing }] = useRemoveFromWishlistMutation();

  const addItem = useCallback(async (id: string) => {
    if (isAuthenticated) await add(id).unwrap();
    else if (!addGuestWishlist(id)) throw new Error("Your wishlist is full (100 items). Remove something to add more.");
  }, [isAuthenticated, add]);

  const removeItem = useCallback(async (id: string) => {
    if (isAuthenticated) await remove(id).unwrap();
    else removeGuestWishlist(id);
  }, [isAuthenticated, remove]);

  return { addItem, removeItem, isBusy: adding || removing };
}

/** Heart state and toggle for one article. Works without an account. */
export function useWishlistToggle(productId: string) {
  const ids = useWishlistIds();
  const { addItem, removeItem, isBusy } = useWishlistActions();
  const [error, setError] = useState("");
  const isWishlisted = ids.includes(productId);

  const toggle = async () => {
    setError("");
    try {
      await (isWishlisted ? removeItem(productId) : addItem(productId));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return { isWishlisted, toggle, isBusy, error };
}
