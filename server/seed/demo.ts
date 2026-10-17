import { Types } from "mongoose";
import { STORE } from "../config/store";
import type { ICoupon } from "../models/Coupon";
import { calculateDiscount } from "../services/coupon.service";
import type { DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus, Size } from "../types";
import { DEMO_CUSTOMERS, DEMO_EMAIL_DOMAIN, demoEmail } from "./data/customers";
import { placeholderImage, placeholderBackImage } from "./data/palette";
import { DEMO_PRODUCTS, type DemoProduct } from "./data/products";
import { REVIEW_COMMENTS } from "./data/reviews";

/**
 * Builds the sample shop: customers, articles, coupons, orders, reviews and newsletter subscribers.
 * Everything is made in memory as plain objects (nothing here touches the database), from a fixed random
 * seed, so two runs on the same day give the same shop. Dates are counted back from `now`.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;
export const DEMO_ORDER_COUNT = 60;
export const DEMO_ORDER_DAYS = 75;

/** Small seeded random number generator (mulberry32). */
export function createRandom(seed: number) {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(list: readonly T[]): T => list[int(0, list.length - 1)]!;
  const weighted = <T,>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = next() * total;
    for (const [value, w] of entries) {
      roll -= w;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1]![0];
  };
  return { next, int, pick, weighted };
}
type Random = ReturnType<typeof createRandom>;

export interface DemoDocs {
  users: ReturnType<typeof buildUsers>;
  products: ReturnType<typeof buildProducts>;
  coupons: ReturnType<typeof buildCoupons>;
  orders: ReturnType<typeof buildOrders>["orders"];
  reviews: ReturnType<typeof buildOrders>["reviews"];
  subscribers: ReturnType<typeof buildSubscribers>;
}

// ---------- Customers ----------

function buildUsers(now: Date, password: string) {
  return DEMO_CUSTOMERS.map((c) => {
    const createdAt = new Date(now.getTime() - c.daysAgo * DAY);
    const active = c.isActive !== false;
    return {
      _id: new Types.ObjectId(),
      name: c.name,
      email: demoEmail(c.name),
      password, // hashed by the User model when saved
      role: "customer" as const,
      phone: c.phone,
      addresses: [{ fullName: c.name, phone: c.phone, line1: c.line1, city: c.city, province: c.province, postalCode: c.postalCode, country: "Pakistan", isDefault: true }],
      isActive: active,
      isEmailVerified: c.isEmailVerified !== false,
      lastLoginAt: active ? new Date(now.getTime() - Math.min(c.daysAgo, 3) * DAY) : undefined,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

// ---------- Articles ----------

/** Splits `total` pieces over the given number of slots as evenly as possible. */
function spread(total: number, slots: number): number[] {
  return Array.from({ length: slots }, (_, i) => Math.floor(total / slots) + (i < total % slots ? 1 : 0));
}

function buildProducts(now: Date, categoryIds: ReadonlyMap<string, Types.ObjectId>, random: Random) {
  return DEMO_PRODUCTS.map((p: DemoProduct) => {
    const category = categoryIds.get(p.category);
    if (!category) throw new Error(`Sample article ${p.sku} uses the category "${p.category}", which does not exist`);
    const createdAt = new Date(now.getTime() - p.daysOld * DAY);
    // Final stock on the shelf per size. Low: 1-5 pieces in total. Out: none.
    const stockBySize = p.stock === "out" ? new Array<number>(p.sizes.length).fill(0) : p.stock === "low" ? spread(random.int(2, 5), p.sizes.length) : p.sizes.map(() => random.int(3, 22));
    const sizes = p.sizes.map((size, i) => ({ size, stock: stockBySize[i]! }));
    const images = [{ ...placeholderImage(p.garment, p.color), isPrimary: true }, { ...placeholderBackImage(p.garment, p.color), isPrimary: false }]; // front, then back (shown on hover)
    return {
      _id: new Types.ObjectId(),
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: `${p.short}\n\nFabric: ${p.material}. Colours are close to the real thing, but screens differ a little. Please check the size guide before you order.`,
      shortDescription: p.short,
      price: p.price,
      discountPrice: p.discountPrice,
      category,
      images,
      sizes,
      material: p.material,
      sku: p.sku,
      featured: p.featured === true,
      newArrival: p.newArrival === true,
      bestSeller: p.bestSeller === true,
      onSale: p.discountPrice !== undefined,
      status: p.status ?? (p.stock === "out" ? ("out_of_stock" as const) : ("active" as const)), // an article with no stock is out_of_stock, as the shop sets it
      createdAt,
      updatedAt: createdAt,
      // Filled in once the orders and reviews are known
      rating: 0,
      numReviews: 0,
      soldCount: 0,
    };
  });
}

// ---------- Coupons ----------

/** Codes of the sample coupons, used by `seed:reset` to find them again. */
export const DEMO_COUPON_CODES = ["WELCOME10", "FLAT500", "EID25", "SUMMER15", "LIMITED5", "INACTIVE10"] as const;

function buildCoupons(now: Date) {
  const day = (offset: number) => new Date(now.getTime() + offset * DAY);
  const base = (code: string, extra: Omit<ICoupon, "code" | "minimumOrderAmount" | "usedCount" | "isActive" | "createdAt" | "updatedAt"> & Partial<ICoupon>) => ({
    _id: new Types.ObjectId(), minimumOrderAmount: 0, usedCount: 0, isActive: true, createdAt: day(-100), updatedAt: day(-100), ...extra, code,
  });
  return [
    base("WELCOME10", { discountType: "percentage", discountValue: 10, minimumOrderAmount: 3000, maximumDiscount: 1000, startDate: day(-100), expiryDate: day(90) }),
    base("FLAT500", { discountType: "fixed", discountValue: 500, minimumOrderAmount: 5000, startDate: day(-100), expiryDate: day(60) }),
    base("EID25", { discountType: "percentage", discountValue: 25, minimumOrderAmount: 6000, maximumDiscount: 3000, startDate: day(-80), expiryDate: day(-50) }), // has ended
    base("SUMMER15", { discountType: "percentage", discountValue: 15, minimumOrderAmount: 4000, startDate: day(10), expiryDate: day(40) }), // not started yet
    base("LIMITED5", { discountType: "percentage", discountValue: 5, minimumOrderAmount: 1000, startDate: day(-60), expiryDate: day(30), usageLimit: 5 }), // used up below
    base("INACTIVE10", { discountType: "percentage", discountValue: 10, startDate: day(-100), expiryDate: day(60), isActive: false }), // switched off by the admin
  ];
}

// ---------- Orders and reviews ----------

type DemoUser = ReturnType<typeof buildUsers>[number];
type DemoProductDoc = ReturnType<typeof buildProducts>[number];
type DemoCoupon = ReturnType<typeof buildCoupons>[number];

interface Draft {
  user: DemoUser;
  createdAt: Date;
  items: { product: DemoProductDoc; size: Size; quantity: number }[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  chain: { status: OrderStatus; note?: string; changedAt: Date }[]; // every step the order would have taken by now
}

const CANCEL_NOTES = ["Cancelled at the customer's request", "Customer asked to cancel: ordered the wrong size", "Cancelled: customer could not be reached to confirm"];
const SHIP_NOTES = ["Handed to the courier", "Dispatched with the courier"];

/** The steps an order of this age has gone through. Steps that would lie in the future are dropped. */
function buildChain(random: Random, createdAt: Date, express: boolean, now: Date): Draft["chain"] {
  const age = (now.getTime() - createdAt.getTime()) / DAY;
  const outcome = random.weighted<"delivered" | "cancelled" | "shipped" | "processing" | "confirmed" | "pending">(
    age < 1 ? [["pending", 4], ["confirmed", 4], ["cancelled", 1]]
      : age < 4 ? [["pending", 1], ["confirmed", 2], ["processing", 3], ["shipped", 2], ["cancelled", 1]]
      : age < 9 ? [["processing", 1], ["shipped", 3], ["delivered", 6], ["cancelled", 1]]
      : [["delivered", 17], ["cancelled", 3], ["shipped", 1]],
  );
  let at = createdAt.getTime();
  const chain: Draft["chain"] = [{ status: "pending", changedAt: new Date(at) }];
  const step = (status: OrderStatus, minHours: number, maxHours: number, note?: string) => {
    at += random.int(minHours * 60, maxHours * 60) * 60_000;
    chain.push({ status, note, changedAt: new Date(at) });
  };
  if (outcome === "cancelled") {
    if (random.next() < 0.5) step("confirmed", 1, 8);
    step("cancelled", 2, 30, random.pick(CANCEL_NOTES));
  } else {
    const order: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];
    const last = order.indexOf(outcome === "pending" ? "confirmed" : outcome);
    const upTo = outcome === "pending" ? -1 : last;
    for (let i = 0; i <= upTo; i += 1) {
      const status = order[i]!;
      if (status === "processing" && random.next() < 0.3) continue; // confirmed orders may go straight to shipped
      if (status === "confirmed") step(status, 1, 8);
      else if (status === "processing") step(status, 6, 26);
      else if (status === "shipped") step(status, 6, 30, random.pick(SHIP_NOTES));
      else step(status, express ? 20 : 48, express ? 44 : 96);
    }
  }
  return chain.filter((e) => e.changedAt.getTime() <= now.getTime());
}

function buildOrders(now: Date, users: DemoUser[], products: DemoProductDoc[], coupons: DemoCoupon[], random: Random) {
  const sellable = products.filter((p) => p.status === "active" || p.status === "out_of_stock") // draft and archived articles were never sold;
  const lastDate = (c: Draft["chain"]) => c[c.length - 1]!.changedAt;

  // 1. Who bought what and when, and how far each order got
  const drafts: Draft[] = [];
  for (let i = 0; i < DEMO_ORDER_COUNT; i += 1) {
    const user = random.pick(users);
    const joinedDaysAgo = (now.getTime() - user.createdAt.getTime()) / DAY;
    const maxDays = Math.min(DEMO_ORDER_DAYS, Math.floor(joinedDaysAgo) - 1);
    const daysAgo = Math.floor(maxDays * random.next() ** 1.5); // more recent orders than old ones
    const createdAt = new Date(now.getTime() - daysAgo * DAY - random.int(30, 1000) * 60_000); // spread over the day
    const pool = sellable.filter((p) => p.createdAt.getTime() < createdAt.getTime());
    const lines = random.weighted([[1, 5], [2, 4], [3, 1]] as const);
    const chosen = new Set<DemoProductDoc>();
    while (chosen.size < Math.min(lines, pool.length)) chosen.add(random.pick(pool));
    const items = [...chosen].map((product) => {
      return { product, size: random.pick(product.sizes).size, quantity: random.weighted([[1, 8], [2, 2]] as const) };
    });
    const deliveryMethod: DeliveryMethod = random.next() < 0.15 ? "express" : "standard";
    const paymentMethod: PaymentMethod = random.next() < 0.6 ? "cod" : "stripe";
    drafts.push({ user, createdAt, items, deliveryMethod, paymentMethod, chain: buildChain(random, createdAt, deliveryMethod === "express", now) });
  }
  drafts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // 2. Coupons. The limited one goes to the first five eligible orders that were not cancelled.
  const byCode = new Map(coupons.map((c) => [c.code, c]));
  const subtotalOf = (d: Draft) => d.items.reduce((sum, i) => sum + (i.product.discountPrice ?? i.product.price) * i.quantity, 0);
  const cancelled = (d: Draft) => d.chain[d.chain.length - 1]!.status === "cancelled";
  const couponFor = new Map<Draft, DemoCoupon>();
  const eligible = (code: string, d: Draft) => {
    const c = byCode.get(code)!;
    return d.createdAt >= c.startDate && d.createdAt <= c.expiryDate && subtotalOf(d) >= c.minimumOrderAmount;
  };
  let limitedLeft = 5;
  for (const d of drafts) {
    const roll = random.next();
    let code: string | undefined;
    if (limitedLeft > 0 && !cancelled(d) && eligible("LIMITED5", d) && roll < 0.5) {
      code = "LIMITED5";
      limitedLeft -= 1;
    } else if (eligible("EID25", d) && roll < 0.6) code = "EID25";
    else if (eligible("FLAT500", d) && roll < 0.35) code = "FLAT500";
    else if (eligible("WELCOME10", d) && roll < 0.3) code = "WELCOME10";
    if (code) couponFor.set(d, byCode.get(code)!);
  }
  // Make sure the limited coupon really is used up, whatever the random rolls were
  for (const d of drafts) {
    if (limitedLeft === 0) break;
    if (!couponFor.has(d) && !cancelled(d) && eligible("LIMITED5", d)) {
      couponFor.set(d, byCode.get("LIMITED5")!);
      limitedLeft -= 1;
    }
  }

  // 3. Turn the drafts into orders
  const numbers = new Set<string>();
  const orders = drafts.map((d) => {
    const status = d.chain[d.chain.length - 1]!.status;
    const items = d.items.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      slug: i.product.slug,
      image: i.product.images[0]?.url,
      sku: i.product.sku,
      size: i.size,
      quantity: i.quantity,
      price: i.product.discountPrice ?? i.product.price,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const coupon = couponFor.get(d);
    const discount = coupon ? calculateDiscount(coupon, subtotal) : 0;
    const delivery = STORE.delivery[d.deliveryMethod];
    const shippingCost = delivery.freeOver !== null && subtotal - discount >= delivery.freeOver ? 0 : delivery.fee;
    const total = subtotal - discount + shippingCost; // the tax rate is 0

    // Card orders are paid when placed (an unpaid card order would be cancelled by the clean-up job); cash is paid on delivery
    let paymentStatus: PaymentStatus;
    if (d.paymentMethod === "stripe") paymentStatus = status === "cancelled" ? "refunded" : "paid";
    else paymentStatus = status === "delivered" ? "paid" : "pending";

    const history = d.chain.map((e) => ({ ...e }));
    if (d.paymentMethod === "stripe" && status === "cancelled") history.push({ status: "cancelled", note: "Payment refunded", changedAt: new Date(Math.min(lastDate(d.chain).getTime() + 60_000, now.getTime())) });

    const day = d.createdAt.toISOString().slice(0, 10).replace(/-/g, "");
    let orderNumber: string;
    do orderNumber = `ORD-${day}-${random.int(0x1000, 0xffff).toString(16).toUpperCase()}`;
    while (numbers.has(orderNumber));
    numbers.add(orderNumber);

    const a = d.user.addresses[0]!;
    return {
      _id: new Types.ObjectId(),
      orderNumber,
      user: d.user._id,
      items,
      shippingAddress: { fullName: a.fullName, phone: a.phone, line1: a.line1, city: a.city, province: a.province, postalCode: a.postalCode, country: "Pakistan" },
      deliveryMethod: d.deliveryMethod,
      paymentMethod: d.paymentMethod,
      paymentStatus,
      orderStatus: status,
      subtotal,
      discount,
      shippingCost,
      tax: 0,
      total,
      coupon: coupon ? { code: coupon.code, discountAmount: discount } : undefined,
      statusHistory: history,
      inventoryRestored: status === "cancelled", // stock for cancelled orders is back on the shelf (the sample stock figures are final)
      createdAt: d.createdAt,
      updatedAt: history[history.length - 1]!.changedAt,
      deliveredAt: status === "delivered" ? lastDate(d.chain) : undefined,
    };
  });

  // 4. Reviews: some buyers of each delivered order rate what they got
  const reviews: {
    _id: Types.ObjectId; user: Types.ObjectId; product: Types.ObjectId; order: Types.ObjectId; rating: number; comment: string; createdAt: Date; updatedAt: Date;
  }[] = [];
  const reviewed = new Set<string>();
  for (const order of orders) {
    if (!order.deliveredAt) continue;
    for (const item of order.items) {
      const key = `${order.user}:${item.product}`;
      if (reviewed.has(key) || random.next() > 0.6) continue;
      reviewed.add(key);
      const createdAt = new Date(order.deliveredAt.getTime() + random.int(1, 6 * 24) * HOUR);
      if (createdAt.getTime() > now.getTime()) continue;
      const rating = random.weighted([[5, 45], [4, 30], [3, 13], [2, 7], [1, 5]] as const);
      const comments = REVIEW_COMMENTS[rating]!;
      reviews.push({ _id: new Types.ObjectId(), user: order.user, product: item.product, order: order._id, rating, comment: comments[reviews.length % comments.length]!, createdAt, updatedAt: createdAt });
    }
  }

  // 5. Figures that the shop keeps on each article and coupon
  for (const p of products) {
    p.soldCount = orders.filter((o) => o.orderStatus !== "cancelled").reduce((sum, o) => sum + o.items.filter((i) => i.product.equals(p._id)).reduce((s, i) => s + i.quantity, 0), 0);
    const mine = reviews.filter((r) => r.product.equals(p._id));
    p.numReviews = mine.length;
    p.rating = mine.length ? Math.round((mine.reduce((s, r) => s + r.rating, 0) / mine.length) * 10) / 10 : 0;
  }
  for (const c of coupons) c.usedCount = orders.filter((o) => o.orderStatus !== "cancelled" && o.coupon?.code === c.code).length;

  return { orders: orders.map(({ deliveredAt: _unused, ...o }) => o), reviews };
}

// ---------- Newsletter ----------

function buildSubscribers(now: Date) {
  const list: [string, number, boolean][] = [["sara.n", 60, true], ["hira.m", 48, true], ["zainab.k", 33, true], ["maryam.f", 21, true], ["iqra.s", 14, false], ["laiba.t", 5, true]];
  return list.map(([local, daysAgo, isActive]) => {
    const createdAt = new Date(now.getTime() - daysAgo * DAY);
    return { _id: new Types.ObjectId(), email: `${local}@${DEMO_EMAIL_DOMAIN}`, isActive, createdAt, updatedAt: createdAt };
  });
}

// ---------- Everything ----------

export interface DemoOptions {
  now?: Date;
  /** Plain password for every sample customer (stored hashed). */
  password: string;
  /** Category id by category name (the categories are seeded first). */
  categoryIds: ReadonlyMap<string, Types.ObjectId>;
  randomSeed?: number;
}

export function buildDemo({ now = new Date(), password, categoryIds, randomSeed = 20240607 }: DemoOptions): DemoDocs {
  const random = createRandom(randomSeed);
  const users = buildUsers(now, password);
  const products = buildProducts(now, categoryIds, random);
  const coupons = buildCoupons(now);
  const { orders, reviews } = buildOrders(now, users, products, coupons, random);
  return { users, products, coupons, orders, reviews, subscribers: buildSubscribers(now) };
}
