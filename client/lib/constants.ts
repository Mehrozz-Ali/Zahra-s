export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_CART_QTY = 10;
export const LOW_STOCK_THRESHOLD = 5;

/** Card payments are offered only when a Stripe publishable key is configured. */
export const CARD_PAYMENTS_ENABLED = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const STATUS_OPTIONS = [
  { value: "active", label: "Active", hint: "Visible in the store" },
  { value: "draft", label: "Draft", hint: "Only admins can see it" },
  { value: "out_of_stock", label: "Out of stock", hint: "Shown as sold out" },
  { value: "archived", label: "Archived", hint: "Hidden from the store" },
] as const;
