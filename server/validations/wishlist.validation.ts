import { z } from "zod";
import { objectId } from "./common";

export const wishlistParamSchema = z.object({ productId: objectId });
