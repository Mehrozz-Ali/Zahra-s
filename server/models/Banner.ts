import { Schema, model } from "mongoose";
import type { CloudinaryImage } from "../types";

export const BANNER_THEMES = ["light", "dark"] as const;
export type BannerTheme = (typeof BANNER_THEMES)[number];
export const MAX_BANNERS = 8;

export interface IBanner {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: CloudinaryImage; // wide picture for tablets and computers
  mobileImage?: CloudinaryImage; // optional tall picture for phones
  textTheme: BannerTheme; // "light" = white text for dark pictures, "dark" = black text for bright pictures
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = { url: String, publicId: String };

const bannerSchema = new Schema<IBanner>(
  {
    eyebrow: { type: String, trim: true, maxlength: 60 },
    title: { type: String, trim: true, maxlength: 100 },
    subtitle: { type: String, trim: true, maxlength: 200 },
    buttonText: { type: String, trim: true, maxlength: 30 },
    buttonLink: { type: String, trim: true, maxlength: 300 },
    image: imageSchema,
    mobileImage: imageSchema,
    textTheme: { type: String, enum: BANNER_THEMES, default: "light" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });

export const Banner = model<IBanner>("Banner", bannerSchema);
