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

export type UserRole = "customer" | "admin";

export interface HealthStatus {
  status: "ok";
  database: "connected" | "disconnected";
  uptime: number;
  timestamp: string;
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: { url: string; publicId: string };
  addresses: Address[];
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId: string };
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export type BannerTheme = "light" | "dark";

export interface Banner {
  _id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: { url: string; publicId: string };
  mobileImage?: { url: string; publicId: string };
  textTheme: BannerTheme;
  isActive: boolean;
  sortOrder: number;
}

export interface BannerInput {
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  textTheme: BannerTheme;
  isActive: boolean;
}

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type ProductStatus = "active" | "draft" | "out_of_stock" | "archived";
export type ProductSort = "newest" | "price-low" | "price-high" | "best-selling" | "top-rated";

export interface ProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ProductSize {
  size: Size;
  stock: number;
}

export interface Product {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string; // omitted from list responses
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  finalPrice: number;
  discountPercentage: number;
  category: Pick<Category, "_id" | "name" | "slug">;
  images: ProductImage[];
  sizes: ProductSize[];
  material?: string;
  brand?: string;
  sku: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  onSale: boolean;
  status: ProductStatus;
  rating: number;
  numReviews: number;
  soldCount: number;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

/** Body for creating or editing an article. `category` is a category _id. */
export interface ProductInput {
  name: string;
  shortDescription?: string;
  description: string;
  price: number;
  discountPrice?: number | null; // null removes the discount when editing
  category: string;
  images: ProductImage[];
  sizes: ProductSize[];
  material?: string;
  brand?: string;
  sku?: string;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  onSale: boolean;
  status: ProductStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductList {
  products: Product[];
  pagination: PaginationMeta;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string; // slug
  slugs?: string; // comma-separated product slugs
  size?: Size;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  onSale?: boolean;
  sort?: ProductSort;
}

export interface AdminProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string; // category _id
  status?: ProductStatus;
  stock?: "all" | "low" | "out";
}

export interface ProductFilters {
  priceRange: { min: number; max: number };
  sizes: Size[];
}

export interface CartLineInput {
  productId: string;
  size: Size;
  quantity: number;
}

/** A cart line priced by the server from live product data. */
export interface PricedLine extends CartLineInput {
  maxQuantity: number;
  available: boolean;
  issue?: string;
  name?: string;
  slug?: string;
  image?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  freeShippingOver: number;
  amountToFreeShipping: number;
}

export interface CartPricing {
  items: PricedLine[];
  summary: CartSummary;
}

export interface WishlistItem {
  product: Product;
  available: boolean; // false when the article was archived, unpublished or its category hidden
}

export type DeliveryMethod = "standard" | "express";
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode?: string;
}

export interface DeliveryQuote {
  method: DeliveryMethod;
  label: string;
  estimate: string;
  summary: CartSummary;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  description: string; // e.g. "10% off"
}

export interface CheckoutQuote {
  items: PricedLine[];
  options: DeliveryQuote[];
  coupon: AppliedCoupon | null;
  couponError: string | null; // why the entered code does not apply
}

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image?: string;
  sku: string;
  size: Size;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress & { country: string };
  deliveryMethod: DeliveryMethod;
  paymentMethod: "stripe" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus: OrderStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  coupon?: { code: string; discountAmount: number };
  statusHistory: Array<{ status: OrderStatus; note?: string; changedAt: string }>;
  createdAt: string;
}

export type OrderListItem = Pick<Order, "_id" | "orderNumber" | "items" | "orderStatus" | "paymentMethod" | "paymentStatus" | "total" | "createdAt">;

export interface OrderList {
  orders: OrderListItem[];
  pagination: PaginationMeta;
}

// ---------- Reviews ----------
export interface Review {
  _id: string;
  rating: number;
  comment: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewList {
  reviews: Review[];
  distribution: Array<{ stars: number; count: number }>;
  pagination: PaginationMeta;
}

export interface MyReviewState {
  review: { _id: string; rating: number; comment: string } | null;
  canReview: boolean;
}

export interface LatestReview {
  _id: string;
  rating: number;
  comment: string;
  authorName: string;
  productName: string;
  productSlug: string;
  createdAt: string;
}

// ---------- Admin ----------
export interface DashboardData {
  cards: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    lowStockThreshold: number;
  };
  daily: Array<{ date: string; revenue: number; orders: number }>; // last 30 days, oldest first
  monthly: Array<{ month: string; revenue: number; orders: number }>; // last 12 months, oldest first
  salesByCategory: Array<{ name: string; revenue: number; units: number }>;
  recentOrders: Array<{
    _id: string; orderNumber: string; customerName: string; total: number;
    orderStatus: OrderStatus; paymentStatus: Order["paymentStatus"]; paymentMethod: Order["paymentMethod"]; createdAt: string;
  }>;
  lowStock: Array<{ _id: string; name: string; slug: string; totalStock: number; image?: string }>;
}

export type CouponStatus = "active" | "inactive" | "expired" | "scheduled" | "used_up";

export interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  status: CouponStatus;
  createdAt: string;
}

export interface CouponList {
  coupons: Coupon[];
  pagination: PaginationMeta;
}

// ---------- Admin: orders, customers, reviews ----------
export type PaymentStatus = Order["paymentStatus"];

export interface AdminOrderListItem {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; email: string; phone?: string } | null;
  shippingAddress: Order["shippingAddress"];
  itemCount: number;
  orderStatus: OrderStatus;
  paymentMethod: Order["paymentMethod"];
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
}

export interface AdminOrderList {
  orders: AdminOrderListItem[];
  statusCounts: Record<OrderStatus, number>;
  pagination: PaginationMeta;
}

export interface AdminOrderListParams {
  page: number;
  q?: string;
  status?: OrderStatus;
  paymentMethod?: "cod" | "stripe";
  paymentStatus?: PaymentStatus;
  from?: string; // ISO
  to?: string;
}

export interface AdminOrder extends Omit<Order, "user"> {
  user: { _id: string; name: string; email: string; phone?: string; isActive: boolean } | null;
  stripePaymentIntentId?: string;
  inventoryRestored?: boolean;
}

export interface AdminOrderDetail {
  order: AdminOrder;
  allowedTransitions: OrderStatus[];
  waitingForPayment: boolean; // an unpaid card order: it can only be cancelled
  refundFailed?: boolean;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orderCount: number;
  totalSpent: number;
  addresses?: Address[];
}

export interface AdminCustomerList {
  customers: AdminCustomer[];
  pagination: PaginationMeta;
}

export interface AdminCustomerDetail {
  customer: AdminCustomer;
  recentOrders: Array<Pick<Order, "_id" | "orderNumber" | "orderStatus" | "paymentMethod" | "paymentStatus" | "total" | "createdAt">>;
}

export interface AdminReview {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { _id: string; name: string; email: string } | null;
  product: { _id: string; name: string; slug: string } | null;
}

export interface AdminReviewList {
  reviews: AdminReview[];
  stats: { average: number; total: number; distribution: Array<{ stars: number; count: number }> };
  pagination: PaginationMeta;
}

// ---------- Admin analytics ----------
export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";
export interface KpiPair { current: number; previous: number }
export interface AnalyticsData {
  range: AnalyticsRange;
  bucket: "day" | "month";
  from: string;
  to: string;
  kpis: {
    revenue: KpiPair;
    orders: KpiPair;
    averageOrderValue: KpiPair;
    unitsSold: KpiPair;
    newCustomers: KpiPair;
    cancellationRate: KpiPair; // percent
  };
  series: Array<{ key: string; revenue: number; orders: number }>; // oldest first; keys are days (YYYY-MM-DD) or months (YYYY-MM)
  topProducts: Array<{ productId: string; name: string; slug: string; image?: string; units: number; revenue: number }>;
  categories: Array<{ name: string; revenue: number; units: number }>;
  paymentMethods: Array<{ method: Order["paymentMethod"]; orders: number; revenue: number }>;
  statuses: Array<{ status: OrderStatus; count: number }>;
  provinces: Array<{ name: string; orders: number; revenue: number }>;
  cities: Array<{ name: string; orders: number; revenue: number }>;
  customers: { buyers: number; returning: number; firstTime: number };
}
