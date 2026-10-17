import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";
import type { Size } from "@/types";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  size: Size;
  unitPrice: number; // for display only; the server recalculates prices at checkout
  quantity: number;
  maxQuantity: number;
}

const lineSchema = z.object({
  productId: z.string(), slug: z.string(), name: z.string(), image: z.string().optional(),
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  unitPrice: z.number().nonnegative(), quantity: z.number().int().min(1), maxQuantity: z.number().int().min(1),
});

/** Reads the saved cart safely: anything malformed is dropped instead of crashing the page. */
export function parseStoredCart(raw: string | null): CartLine[] {
  try {
    return z.array(lineSchema).catch([]).parse(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

interface CartState {
  items: CartLine[];
  hydrated: boolean; // true once the saved cart has been loaded in the browser
}

const isSame = (a: CartLine, b: Pick<CartLine, "productId" | "size">) => a.productId === b.productId && a.size === b.size;

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], hydrated: false } as CartState,
  reducers: {
    hydrate(state, action: PayloadAction<CartLine[]>) {
      state.items = action.payload;
      state.hydrated = true;
    },
    addItem(state, { payload }: PayloadAction<CartLine>) {
      const existing = state.items.find((i) => isSame(i, payload));
      if (!existing) return void state.items.push({ ...payload, quantity: Math.min(payload.quantity, payload.maxQuantity) });
      existing.maxQuantity = payload.maxQuantity;
      existing.unitPrice = payload.unitPrice;
      existing.quantity = Math.min(existing.quantity + payload.quantity, payload.maxQuantity);
    },
    setQuantity(state, { payload }: PayloadAction<Pick<CartLine, "productId" | "size" | "quantity">>) {
      const line = state.items.find((i) => isSame(i, payload));
      if (line) line.quantity = Math.max(1, Math.min(payload.quantity, line.maxQuantity));
    },
    removeItem(state, { payload }: PayloadAction<Pick<CartLine, "productId" | "size">>) {
      state.items = state.items.filter((i) => !isSame(i, payload));
    },
    /** Applies live prices and stock from the server to the saved lines. */
    applyPricing(state, { payload }: PayloadAction<Array<Pick<CartLine, "productId" | "size" | "unitPrice" | "maxQuantity"> & { available: boolean }>>) {
      for (const p of payload) {
        const line = state.items.find((i) => isSame(i, p));
        if (!line || !p.available) continue;
        line.unitPrice = p.unitPrice;
        line.maxQuantity = p.maxQuantity;
        line.quantity = Math.min(line.quantity, p.maxQuantity);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { hydrate, addItem, setQuantity, removeItem, applyPricing, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartCount = (state: { cart: CartState }): number => state.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }): number => state.cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
