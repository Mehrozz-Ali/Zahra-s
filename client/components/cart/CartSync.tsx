"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useAuth } from "@/hooks/useAuth";
import { cartApi } from "@/services/cartApi";
import { hydrate, type CartLine } from "@/store/slices/cartSlice";
import type { CartLineInput } from "@/types";

const lineKey = (l: CartLineInput) => `${l.productId}|${l.size}`;
const toInput = ({ productId, size, quantity }: CartLine): CartLineInput => ({ productId, size, quantity });

/**
 * Renders nothing. While a customer is logged in it keeps the cart saved to their account:
 * on login it merges the browser cart with the saved one, then saves every change.
 */
export function CartSync() {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAuth();
  const items = useAppSelector((s) => s.cart.items);
  const hydrated = useAppSelector((s) => s.cart.hydrated);
  const userId = user?._id ?? null;
  const syncedFor = useRef<string | null>(null);
  const merging = useRef(false);

  // 1. Merge once per login
  useEffect(() => {
    if (isLoading) return;
    if (!userId) {
      syncedFor.current = null;
      return;
    }
    if (!hydrated || syncedFor.current === userId || merging.current) return;
    merging.current = true;

    (async () => {
      try {
        const saved = await dispatch(cartApi.endpoints.getSavedCart.initiate(undefined, { forceRefetch: true })).unwrap();
        const merged = new Map<string, CartLineInput>();
        for (const line of [...saved, ...items.map(toInput)]) {
          const prev = merged.get(lineKey(line));
          merged.set(lineKey(line), prev ? { ...line, quantity: Math.max(prev.quantity, line.quantity) } : line); // max, so re-logging in never doubles a quantity
        }
        const lines = [...merged.values()];
        if (lines.length === 0) {
          syncedFor.current = userId;
          return;
        }
        const priced = await dispatch(cartApi.endpoints.getCartPricing.initiate(lines, { forceRefetch: true })).unwrap();
        const full = priced.items.flatMap<CartLine>((p) =>
          p.available && p.name && p.slug
            ? [{ productId: p.productId, slug: p.slug, name: p.name, image: p.image, size: p.size, unitPrice: p.unitPrice, quantity: p.quantity, maxQuantity: p.maxQuantity }]
            : [],
        );
        syncedFor.current = userId; // set before hydrate so step 2 saves the merged cart
        dispatch(hydrate(full));
      } catch {
        /* offline or API down: keep the browser cart and try again on the next change */
      } finally {
        merging.current = false;
      }
    })();
  }, [userId, isLoading, hydrated, items, dispatch]);

  // 2. Save changes (debounced)
  useEffect(() => {
    if (!userId || syncedFor.current !== userId) return;
    const timer = setTimeout(() => void dispatch(cartApi.endpoints.saveServerCart.initiate(items.map(toInput))), 800);
    return () => clearTimeout(timer);
  }, [items, userId, dispatch]);

  return null;
}
