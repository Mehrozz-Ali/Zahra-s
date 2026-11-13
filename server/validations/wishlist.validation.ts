import { z } from "zod";
import { objectId } from "./common";

export const wishlistParamSchema = z.object({ productId: objectId });

/** Product ids kept in a guest's browser, sent to show them (lookup) or save them to a new login (merge). */
export const wishlistIdsBodySchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")).max(100),
});
