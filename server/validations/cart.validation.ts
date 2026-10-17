import { z } from "zod";
import { STORE } from "../config/store";
import { SIZES } from "../types";
import { objectId } from "./common";

export const cartLine = z.object({
  productId: objectId,
  size: z.enum(SIZES),
  quantity: z.number().int().min(1).max(STORE.maxQuantityPerLine),
});

export const cartLinesSchema = z.object({ lines: z.array(cartLine).max(50, "Too many items in the cart") });

export type CartLineInput = z.infer<typeof cartLine>;
