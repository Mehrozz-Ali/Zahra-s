import { STORE } from "../config/store";
import { Cart } from "../models/Cart";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import type { DeliveryMethod, Size } from "../types";
import type { CartLineInput } from "../validations/cart.validation";
import { ApiError } from "../utils/ApiError";
import { evaluateCoupon, type AppliedCoupon } from "./coupon.service";

export interface PricedLine {
  productId: string;
  size: Size;
  quantity: number; // after adjusting to available stock
  maxQuantity: number;
  available: boolean;
  issue?: string;
  name?: string;
  slug?: string;
  image?: string;
  sku?: string;
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

export function buildSummary(subtotal: number, discount = 0, method: DeliveryMethod = "standard"): CartSummary {
  const option = STORE.delivery[method];
  const afterDiscount = Math.max(0, subtotal - discount);
  const isFree = option.freeOver !== null && afterDiscount >= option.freeOver;
  const shippingCost = afterDiscount === 0 || isFree ? 0 : option.fee;
  const tax = Math.round(afterDiscount * STORE.taxRate);
  const threshold = STORE.delivery.standard.freeOver ?? 0;
  return {
    subtotal,
    discount,
    shippingCost,
    tax,
    total: afterDiscount + shippingCost + tax,
    freeShippingOver: threshold,
    amountToFreeShipping: method === "standard" && afterDiscount > 0 ? Math.max(0, threshold - afterDiscount) : 0,
  };
}

/**
 * Prices cart lines from the database, so what the customer sees (and later pays) never depends on
 * prices or stock held in the browser. Checkout reuses this function.
 */
export async function priceCartLines(lines: CartLineInput[]) {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const [products, categories] = await Promise.all([
    Product.find({ _id: { $in: ids }, status: "active" }).select("name slug sku images sizes finalPrice category"),
    Category.find({ isActive: true, isArchived: false }).select("_id").lean(),
  ]);
  const visibleCategories = new Set(categories.map((c) => String(c._id)));
  const byId = new Map(products.filter((p) => visibleCategories.has(String(p.category))).map((p) => [p.id as string, p]));

  const items: PricedLine[] = lines.map((line) => {
    const base = { productId: line.productId, size: line.size };
    const product = byId.get(line.productId);
    const stock = product?.sizes.find((s) => s.size === line.size)?.stock;

    if (!product || stock === undefined) {
      return { ...base, quantity: line.quantity, maxQuantity: 0, available: false, issue: "This item is no longer available", unitPrice: 0, lineTotal: 0 };
    }
    const image = (product.images.find((i) => i.isPrimary) ?? product.images[0])?.url;
    const details = { name: product.name, slug: product.slug, sku: product.sku, image };
    if (stock === 0) {
      return { ...base, ...details, quantity: line.quantity, maxQuantity: 0, available: false, issue: "Sold out in this size", unitPrice: product.finalPrice, lineTotal: 0 };
    }
    const maxQuantity = Math.min(stock, STORE.maxQuantityPerLine);
    const quantity = Math.min(line.quantity, maxQuantity);
    return {
      ...base, ...details, quantity, maxQuantity, available: true,
      issue: quantity < line.quantity ? `Only ${maxQuantity} available, so the quantity was reduced` : undefined,
      unitPrice: product.finalPrice, lineTotal: product.finalPrice * quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, summary: buildSummary(subtotal) };
}

export async function getSavedCart(userId: string): Promise<CartLineInput[]> {
  const cart = await Cart.findOne({ user: userId }).lean();
  return (cart?.items ?? []).map((i) => ({ productId: String(i.product), size: i.size, quantity: i.quantity }));
}

/** Replaces the saved cart. Duplicate lines are merged. */
export async function saveCart(userId: string, lines: CartLineInput[]): Promise<CartLineInput[]> {
  const merged = new Map<string, CartLineInput>();
  for (const l of lines) {
    const key = `${l.productId}|${l.size}`;
    const prev = merged.get(key);
    merged.set(key, prev ? { ...l, quantity: Math.min(prev.quantity + l.quantity, STORE.maxQuantityPerLine) } : l);
  }
  const clean = [...merged.values()];
  await Cart.findOneAndUpdate(
    { user: userId },
    { items: clean.map((l) => ({ product: l.productId, size: l.size, quantity: l.quantity })) },
    { upsert: true, setDefaultsOnInsert: true },
  );
  return clean;
}

/**
 * Prices the cart and shows what each delivery method would cost. Checkout and order placement both use this.
 * A coupon that does not apply is reported in `couponError` (and gives no discount) instead of failing the whole quote.
 */
export async function quoteCheckout(lines: CartLineInput[], couponCode?: string) {
  const { items } = await priceCartLines(lines);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  let coupon: AppliedCoupon | null = null;
  let couponError: string | null = null;
  if (couponCode) {
    try {
      coupon = (await evaluateCoupon(couponCode, subtotal)).applied;
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode >= 500) throw error;
      couponError = error.message;
    }
  }

  const options = (Object.keys(STORE.delivery) as DeliveryMethod[]).map((method) => ({
    method,
    label: STORE.delivery[method].label,
    estimate: STORE.delivery[method].estimate,
    summary: buildSummary(subtotal, coupon?.discountAmount ?? 0, method),
  }));
  return { items, options, coupon, couponError };
}
