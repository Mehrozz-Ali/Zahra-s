import type { PipelineStage } from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { ORDER_STATUSES } from "../types";
import type { AnalyticsRange } from "../validations/admin.validation";
import { lastDayKeys, lastMonthKeys, pkParts, TZ } from "./dashboard.service";

const PK_OFFSET_MS = 5 * 3600 * 1000; // Pakistan has no daylight saving: always UTC+5
const DAY_MS = 86400000;

/** Midnight (Pakistan time) at the start of the given calendar day, as a real instant. `month` is 1-12 and may overflow. */
const pkMidnight = (y: number, month: number, day: number) => new Date(Date.UTC(y, month - 1, day) - PK_OFFSET_MS);

export interface AnalyticsWindow {
  bucket: "day" | "month";
  keys: string[];
  /** Start of the selected period and of the equally long period before it. The selected period runs up to `now`. */
  start: Date;
  prevStart: Date;
}

/**
 * "7d/30d/90d" are the last N calendar days including today; "12m" is the last 12 calendar months including this one.
 * The comparison period is the same length immediately before it.
 */
export function analyticsWindow(range: AnalyticsRange, now = new Date()): AnalyticsWindow {
  const { y, m, d } = pkParts(now);
  if (range === "12m") {
    return { bucket: "month", keys: lastMonthKeys(12, now), start: pkMidnight(y, m - 11, 1), prevStart: pkMidnight(y, m - 23, 1) };
  }
  const n = Number(range.slice(0, -1));
  const start = new Date(pkMidnight(y, m, d).getTime() - (n - 1) * DAY_MS);
  return { bucket: "day", keys: lastDayKeys(n, now), start, prevStart: new Date(start.getTime() - n * DAY_MS) };
}

const isRevenue = { $and: [{ $ne: ["$orderStatus", "cancelled"] }, { $or: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$orderStatus", "delivered"] }] }] };
const notCancelled = { $ne: ["$orderStatus", "cancelled"] };
const one = (cond: unknown) => ({ $cond: [cond, 1, 0] });
const REVENUE_STAGE: PipelineStage = { $match: { $expr: isRevenue } };

interface PeriodTotals { revenue: number; revenueOrders: number; placed: number; cancelled: number; units: number }
const EMPTY: PeriodTotals = { revenue: 0, revenueOrders: 0, placed: 0, cancelled: 0, units: 0 };

export async function getAnalytics(range: AnalyticsRange, now = new Date()) {
  const w = analyticsWindow(range, now);
  const inPeriod: PipelineStage = { $match: { createdAt: { $gte: w.start, $lte: now } } };
  const fmt = w.bucket === "day" ? "%Y-%m-%d" : "%Y-%m";

  const [totalsRaw, seriesRaw, products, categories, payments, statusRaw, provinces, cities, newCustomersAgg, buyerIds] = await Promise.all([
    // Selected period and the one before it, in one pass
    Order.aggregate<PeriodTotals & { _id: "cur" | "prev" }>([
      { $match: { createdAt: { $gte: w.prevStart, $lte: now } } },
      { $group: {
        _id: { $cond: [{ $gte: ["$createdAt", w.start] }, "cur", "prev"] },
        revenue: { $sum: { $cond: [isRevenue, "$total", 0] } },
        revenueOrders: { $sum: one(isRevenue) },
        placed: { $sum: one(notCancelled) },
        cancelled: { $sum: one({ $eq: ["$orderStatus", "cancelled"] }) },
        units: { $sum: { $cond: [isRevenue, { $sum: "$items.quantity" }, 0] } },
      } },
    ]),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      inPeriod, { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: { $dateToString: { format: fmt, date: "$createdAt", timezone: TZ } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [isRevenue, "$total", 0] } } } },
    ]),
    Order.aggregate<{ _id: unknown; name: string; image?: string; slug: string; units: number; revenue: number }>([
      inPeriod, REVENUE_STAGE, { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $last: "$items.name" }, slug: { $last: "$items.slug" }, image: { $last: "$items.image" }, units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
      { $sort: { revenue: -1, units: -1 } }, { $limit: 8 },
    ]),
    Order.aggregate<{ name: string; revenue: number; units: number }>([
      inPeriod, REVENUE_STAGE, { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "p" } },
      { $unwind: "$p" },
      { $group: { _id: "$p.category", revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, units: { $sum: "$items.quantity" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "c" } },
      { $project: { _id: 0, name: { $ifNull: [{ $arrayElemAt: ["$c.name", 0] }, "Removed category"] }, revenue: 1, units: 1 } },
      { $sort: { revenue: -1 } }, { $limit: 8 },
    ]),
    Order.aggregate<{ _id: string; orders: number; revenue: number }>([
      inPeriod, { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: "$paymentMethod", orders: { $sum: 1 }, revenue: { $sum: { $cond: [isRevenue, "$total", 0] } } } },
    ]),
    Order.aggregate<{ _id: string; count: number }>([inPeriod, { $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.aggregate<{ _id: string; orders: number; revenue: number }>([
      inPeriod, { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: "$shippingAddress.province", orders: { $sum: 1 }, revenue: { $sum: { $cond: [isRevenue, "$total", 0] } } } },
      { $sort: { orders: -1 } },
    ]),
    Order.aggregate<{ _id: string; name: string; orders: number; revenue: number }>([
      inPeriod, { $match: { orderStatus: { $ne: "cancelled" } } },
      // "lahore", "Lahore " and "LAHORE" are one city
      { $group: { _id: { $toLower: { $trim: { input: "$shippingAddress.city" } } }, name: { $first: { $trim: { input: "$shippingAddress.city" } } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [isRevenue, "$total", 0] } } } },
      { $sort: { orders: -1, revenue: -1 } }, { $limit: 8 },
    ]),
    Promise.all([
      User.countDocuments({ role: "customer", createdAt: { $gte: w.start, $lte: now } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: w.prevStart, $lt: w.start } }),
    ]),
    Order.distinct("user", { createdAt: { $gte: w.start, $lte: now }, orderStatus: { $ne: "cancelled" } }),
  ]);

  const returning = buyerIds.length ? (await Order.distinct("user", { user: { $in: buyerIds }, createdAt: { $lt: w.start }, orderStatus: { $ne: "cancelled" } })).length : 0;

  const cur = totalsRaw.find((t) => t._id === "cur") ?? EMPTY;
  const prev = totalsRaw.find((t) => t._id === "prev") ?? EMPTY;
  const aov = (t: PeriodTotals) => (t.revenueOrders ? Math.round(t.revenue / t.revenueOrders) : 0);
  const cancelRate = (t: PeriodTotals) => { const all = t.placed + t.cancelled; return all ? Math.round((t.cancelled / all) * 1000) / 10 : 0; };
  const pair = (current: number, previous: number) => ({ current, previous });

  const map = new Map(seriesRaw.map((b) => [b._id, b]));
  const statusMap = new Map(statusRaw.map((s) => [s._id, s.count]));

  return {
    range,
    bucket: w.bucket,
    from: w.start.toISOString(),
    to: now.toISOString(),
    kpis: {
      revenue: pair(cur.revenue, prev.revenue),
      orders: pair(cur.placed, prev.placed),
      averageOrderValue: pair(aov(cur), aov(prev)),
      unitsSold: pair(cur.units, prev.units),
      newCustomers: pair(newCustomersAgg[0], newCustomersAgg[1]),
      cancellationRate: pair(cancelRate(cur), cancelRate(prev)), // percent
    },
    series: w.keys.map((key) => ({ key, revenue: map.get(key)?.revenue ?? 0, orders: map.get(key)?.orders ?? 0 })),
    topProducts: products.map((p) => ({ productId: String(p._id), name: p.name, slug: p.slug, image: p.image, units: p.units, revenue: p.revenue })),
    categories,
    paymentMethods: payments.map((p) => ({ method: p._id, orders: p.orders, revenue: p.revenue })),
    statuses: ORDER_STATUSES.map((s) => ({ status: s, count: statusMap.get(s) ?? 0 })),
    provinces: provinces.map((p) => ({ name: p._id, orders: p.orders, revenue: p.revenue })),
    cities: cities.map((c) => ({ name: c.name, orders: c.orders, revenue: c.revenue })),
    customers: { buyers: buyerIds.length, returning, firstTime: buyerIds.length - returning },
  };
}
