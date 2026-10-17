import { z } from "zod";

// Keep these rules in sync with server/validations/banner.validation.ts
const LINK = /^(\/(?!\/)[^\s]*|https?:\/\/[^\s]+)$/i;

export const bannerFormSchema = z
  .object({
    eyebrow: z.string().trim().max(60, "Keep it under 60 characters"),
    title: z.string().trim().max(100, "Keep it under 100 characters"),
    subtitle: z.string().trim().max(200, "Keep it under 200 characters"),
    buttonText: z.string().trim().max(30, "Keep it under 30 characters"),
    buttonLink: z.string().trim().max(300).refine((v) => v === "" || LINK.test(v), 'Use a page like "/shop" or a full link starting with https://'),
    textTheme: z.enum(["light", "dark"]),
    isActive: z.boolean(),
  })
  .refine((v) => !v.buttonText || !!v.buttonLink, { message: "Add a link for the button", path: ["buttonLink"] });
export type BannerFormInput = z.input<typeof bannerFormSchema>;
export type BannerFormOutput = z.output<typeof bannerFormSchema>;
