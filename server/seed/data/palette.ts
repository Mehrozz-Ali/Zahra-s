/** Colours used by the sample articles. The names also become the colour options a shopper picks. */
export const COLORS = {
  rose: { name: "Rose", code: "#B9788A" },
  ivory: { name: "Ivory", code: "#E8DCC8" },
  sage: { name: "Sage", code: "#8FA58A" },
  navy: { name: "Navy", code: "#2B3A5C" },
  mustard: { name: "Mustard", code: "#D4A83A" },
  maroon: { name: "Maroon", code: "#7A2E3B" },
  teal: { name: "Teal", code: "#2E7C7F" },
  lavender: { name: "Lavender", code: "#A593C4" },
  charcoal: { name: "Charcoal", code: "#43454A" },
  peach: { name: "Peach", code: "#E9A98F" },
} as const;
export type ColorKey = keyof typeof COLORS;

export const GARMENTS = ["dress", "kurta", "suit"] as const;
export type Garment = (typeof GARMENTS)[number];

/** Where the sample pictures are served from (client/public/seed) and how the database refers to them. */
export const placeholderImage = (garment: Garment, color: ColorKey) => ({ url: `/seed/${garment}-${color}.svg`, publicId: `seed/${garment}-${color}` });
export const placeholderBackImage = (garment: Garment, color: ColorKey) => ({ url: `/seed/${garment}-${color}-back.svg`, publicId: `seed/${garment}-${color}-back` });
export const swatchImage = (color: ColorKey) => ({ url: `/seed/swatch-${color}.svg`, publicId: `seed/swatch-${color}` });
