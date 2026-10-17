import type { FilterQuery } from "mongoose";
import { Order, type IOrder } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { LOW_STOCK_THRESHOLD } from "../types";

export const TZ = "Asia/Karachi";
const DAYS = 30;
const MONTHS = 12;

/**
 * Revenue only counts money that is really earned: an order that is not cancelled and is either paid (card)
 * or delivered (cash is collected by the courier). Orders still in progress are shown as orders, not revenue.
 */
export const REVENUE_MATCH: FilterQuery<IOrder> = { orderStatus: { $ne: "cancelled" }, $or: [{ paymentStatus: "paid" }, { orderStatus: "delivered" }] };
export const PLACED_MATCH: FilterQuery<IOrder> = { orderStatus: { $ne: "cancelled" } };

const pad = (n: number) => String(n).padStart(2, "0");
/** Calendar parts of a moment in Pakistan time, so "today" and month edges match the shop's day, not the server's. */
export function pkParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}
export const dayKey = (d: Date) => { const p = pkParts(d); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const monthKey = (d: Date) => { const p = pkParts(d); return `${p.y}-${pad(p.m)}`; };

/** The last `n` day keys (oldest first) ending today, as Pakistan calendar dates. */
export function lastDayKeys(n: number, now = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(new Date(now.getTime() - (n - 1 - i) * 86400000)));
}

/** The last `n` month keys (oldest first) ending this month. */
export function lastMonthKeys(n: number, now = new Date()): string[] {
  const { y, m } = pkParts(now);
  return Array.from({ length: n }, (_, i) => {
    const idx = y * 12 + (m - 1) - (n - 1 - i);
    return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
  });
}

interface Bucket { _id: string; revenue: number; orders: number }

export async function getDashboard(now = new Date()) {
  const days = lastDayKeys(DAYS, now);
  const months = lastMonthKeys(MONTHS, now);
  const dayStart = new Date(now.getTime() - (DAYS + 1) * 86400000);
  const monthStart = new Date(now.getTime() - (MONTHS + 1) * 31 * 86400000);

  const bucket = (format: string, since: Date) => [
    { $match: { ...PLACED_MATCH, createdAt: { $gte: since } } },
    { $group: {
      _id: { $dateToString: { format, date: "$createdAt", timezone: TZ } },
      orders: { $sum: 1 },
      revenue: { $sum: { $cond: [{ $or: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$orderStatus", "delivered"] }] }, "$total", 0] } },
    } },
  ];

  const [
    revenueAgg, totalOrders, totalCustomers, totalProducts, pendingOrders, lowStockCount, outOfStockCount,
    dailyRaw, monthlyRaw, categoryRaw, recentOrders, lowStockProducts,
  ] = await Promise.all([
    Order.aggregate<{ total: number }>([{ $match: REVENUE_MATCH }, { $group: { _id: null, total: { $sum: "$total" } } }]),
    Order.countDocuments(PLACED_MATCH),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ status: { $ne: "archived" } }),
    Order.countDocuments({ orderStatus: "pending" }),
    Product.countDocuments({ status: { $nin: ["archived", "draft"] }, totalStock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ status: { $nin: ["archived", "draft"] }, totalStock: 0 }),
    Order.aggregate<Bucket>(bucket("%Y-%m-%d", dayStart)),
    Order.aggregate<Bucket>(bucket("%Y-%m", monthStart)),
    // Item sales by category (before discounts), from the price paid at the time
    Order.aggregate<{ _id: string; name: string; revenue: number; units: number }>([
      { $match: REVENUE_MATCH },
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "p" } },
      { $unwind: "$p" },
      { $group: { _id: "$p.category", revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, units: { $sum: "$items.quantity" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "c" } },
      { $project: { name: { $ifNull: [{ $arrayElemAt: ["$c.name", 0] }, "Removed category"] }, revenue: 1, units: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(6).populate<{ user: { name: string } | null }>("user", "name").select("orderNumber user total orderStatus paymentStatus paymentMethod createdAt").lean(),
    Product.find({ status: { $nin: ["archived", "draft"] }, totalStock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ totalStock: 1, name: 1 }).limit(8).select("name slug totalStock images").lean(),
  ]);

  const dailyMap = new Map(dailyRaw.map((b) => [b._id, b]));
  const monthlyMap = new Map(monthlyRaw.map((b) => [b._id, b]));

  return {
    cards: {
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    },
    daily: days.map((date) => ({ date, revenue: dailyMap.get(date)?.revenue ?? 0, orders: dailyMap.get(date)?.orders ?? 0 })),
    monthly: months.map((month) => ({ month, revenue: monthlyMap.get(month)?.revenue ?? 0, orders: monthlyMap.get(month)?.orders ?? 0 })),
    salesByCategory: categoryRaw.map((c) => ({ name: c.name, revenue: c.revenue, units: c.units })),
    recentOrders: recentOrders.map((o) => ({
      _id: o._id, orderNumber: o.orderNumber, customerName: o.user?.name ?? "Deleted customer", total: o.total,
      orderStatus: o.orderStatus, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod, createdAt: o.createdAt,
    })),
    lowStock: lowStockProducts.map((p) => ({ _id: p._id, name: p.name, slug: p.slug, totalStock: p.totalStock, image: (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url })),
  };
}
