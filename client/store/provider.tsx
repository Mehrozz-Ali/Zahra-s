"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { hydrate, hydrateBuyNow, parseStoredCart, parseStoredLine } from "./slices/cartSlice";
import { makeStore, type AppStore } from "./store";

const CART_KEY = "cart:v1";
const BUY_NOW_KEY = "buynow:v1";

/**
 * What the store looked like when the server rendered the page: empty. While React hydrates, components must read this
 * (not the live store), or any part that hydrates after the saved cart has loaded would show a cart count the server
 * HTML did not have. After hydration they switch to the live state automatically.
 */
let serverState: ReturnType<AppStore["getState"]> | undefined;
const getServerState = () => (serverState ??= makeStore().getState());

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();

  // Load the saved cart after the first render (so server and browser HTML match), then keep it saved.
  useEffect(() => {
    const store = storeRef.current!;
    let saved: string | null = null;
    try { saved = localStorage.getItem(CART_KEY); } catch { /* storage blocked */ }
    let savedBuyNow: string | null = null;
    try { savedBuyNow = sessionStorage.getItem(BUY_NOW_KEY); } catch { /* storage blocked */ }
    store.dispatch(hydrateBuyNow(parseStoredLine(savedBuyNow)));
    store.dispatch(hydrate(parseStoredCart(saved)));
    let lastItems = store.getState().cart.items;
    let lastBuyNow = store.getState().cart.buyNow;
    return store.subscribe(() => {
      const { items, buyNow, hydrated } = store.getState().cart;
      if (!hydrated) return;
      if (items !== lastItems) {
        lastItems = items;
        try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage full or blocked */ }
      }
      if (buyNow !== lastBuyNow) {
        lastBuyNow = buyNow;
        try { if (buyNow) sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(buyNow)); else sessionStorage.removeItem(BUY_NOW_KEY); } catch { /* storage blocked */ }
      }
    });
  }, []);

  return <Provider store={storeRef.current} serverState={getServerState()}>{children}</Provider>;
}
