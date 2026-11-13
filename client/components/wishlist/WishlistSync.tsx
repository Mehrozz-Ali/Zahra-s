"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clearGuestWishlist, getGuestWishlist } from "@/lib/guestWishlist";
import { useMergeWishlistMutation } from "@/services/wishlistApi";

/** Renders nothing. When a visitor logs in, the articles they saved as a guest are added to their account. */
export function WishlistSync() {
  const { user } = useAuth();
  const [merge] = useMergeWishlistMutation();
  const doneFor = useRef<string | null>(null);
  const userId = user?._id ?? null;

  useEffect(() => {
    if (!userId) { doneFor.current = null; return; }
    if (doneFor.current === userId) return;
    doneFor.current = userId;
    const ids = getGuestWishlist();
    if (ids.length === 0) return;
    merge(ids).unwrap().then(clearGuestWishlist).catch(() => { doneFor.current = null; }); // keep the local list and retry later if it failed
  }, [userId, merge]);

  return null;
}
