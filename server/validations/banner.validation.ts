import { z } from "zod";
import { BANNER_THEMES } from "../models/Banner";
import { objectId, optionalText } from "./common";

/** A page on this website ("/shop") or a full web address ("https://..."). Nothing else, so "javascript:" links are impossible. */
const LINK = /^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i;
const link = z.string().trim().max(300).refine((v) => v === "" || LINK.test(v), 'Use a page like "/shop" or a full link starting with https://');
const sortOrder = z.number().int().min(0).max(9999);

const needsLinkForButton = (v: { buttonText?: string; buttonLink?: string }) => !v.buttonText || !!v.buttonLink;
const LINK_MESSAGE = { message: "Add a link for the button", path: ["buttonLink"] };

export const createBannerSchema = z
  .object({
    eyebrow: optionalText(60),
    title: optionalText(100),
    subtitle: optionalText(200),
    buttonText: optionalText(30),
    buttonLink: link.optional().transform((v) => v || undefined),
    textTheme: z.enum(BANNER_THEMES).default("light"),
    isActive: z.boolean().default(true),
  })
  .refine(needsLinkForButton, LINK_MESSAGE);

// On update, "" clears a text field
export const updateBannerSchema = z
  .object({
    eyebrow: z.string().trim().max(60),
    title: z.string().trim().max(100),
    subtitle: z.string().trim().max(200),
    buttonText: z.string().trim().max(30),
    buttonLink: link,
    textTheme: z.enum(BANNER_THEMES),
    isActive: z.boolean(),
    sortOrder,
  })
  .partial()
  .refine((v) => !v.buttonText || v.buttonLink !== "", LINK_MESSAGE);

export const reorderBannersSchema = z.object({ ids: z.array(objectId).min(1).max(50) });
export const bannerImageQuerySchema = z.object({ kind: z.enum(["desktop", "mobile"]).default("desktop") });

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
