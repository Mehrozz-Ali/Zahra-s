import { z } from "zod";

export const pkPhone = z.string().trim().regex(/^(\+92|0)3\d{9}$/, "Use a mobile number like 03001234567");
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const idParamSchema = z.object({ id: objectId });
/** Optional text where an empty string means "not provided". */
export const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => v || undefined);
