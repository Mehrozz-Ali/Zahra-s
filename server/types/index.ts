export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type Size = (typeof SIZES)[number];

export const PRODUCT_STATUSES = ["active", "draft", "out_of_stock", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["stripe", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DELIVERY_METHODS = ["standard", "express"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/** Image stored on Cloudinary. publicId is needed to delete it later. */
export interface CloudinaryImage {
  url: string;
  publicId: string;
}

export interface AuthTokenPayload {
  id: string;
  role: UserRole;
  iat?: number;
}

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;
export type Province = (typeof PROVINCES)[number];

export const PRODUCT_SORTS = ["newest", "price-low", "price-high", "best-selling", "top-rated"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const LOW_STOCK_THRESHOLD = 5;
