import { Types, type FilterQuery } from "mongoose";
import { Order } from "../models/Order";
import { User, type IUser } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { buildPaginationMeta } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";
import type { AdminCustomersQuery } from "../validations/admin.validation";

interface Spend { orders: number; totalSpent: number }

/**
 * Per customer: orders placed (cancelled ones left out) and total spent, which counts only money really received
 * (paid card orders and delivered cash orders), the same rule the dashboard uses for revenue.
 */
async function spendByUser(ids: Array<Types.ObjectId | string>): Promise<Map<string, Spend>> {
  const rows = await Order.aggregate<{ _id: Types.ObjectId; orders: number; totalSpent: number }>([
    { $match: { user: { $in: ids.map((i) => new Types.ObjectId(String(i))) }, orderStatus: { $ne: "cancelled" } } },
    { $group: {
      _id: "$user", orders: { $sum: 1 },
      totalSpent: { $sum: { $cond: [{ $or: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$orderStatus", "delivered"] }] }, "$total", 0] } },
    } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { orders: r.orders, totalSpent: r.totalSpent }]));
}

const PUBLIC_FIELDS = "name email phone isActive isEmailVerified createdAt lastLoginAt"; // never the password or tokens

export async function listCustomers({ page, limit, q, status }: AdminCustomersQuery) {
  const filter: FilterQuery<IUser> = { role: "customer" };
  if (status !== "all") filter.isActive = status === "active";
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select(PUBLIC_FIELDS).lean(),
    User.countDocuments(filter),
  ]);
  const spend = await spendByUser(customers.map((c) => c._id));
  return {
    customers: customers.map((c) => ({ ...c, orderCount: spend.get(String(c._id))?.orders ?? 0, totalSpent: spend.get(String(c._id))?.totalSpent ?? 0 })),
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}

export async function getCustomer(id: string) {
  const customer = await User.findOne({ _id: id, role: "customer" }).select(`${PUBLIC_FIELDS} addresses`).lean();
  if (!customer) throw ApiError.notFound("Customer not found");
  const [spend, recentOrders] = await Promise.all([
    spendByUser([customer._id]),
    Order.find({ user: customer._id }).sort({ createdAt: -1 }).limit(10).select("orderNumber orderStatus paymentMethod paymentStatus total createdAt").lean(),
  ]);
  const s = spend.get(String(customer._id));
  return { customer: { ...customer, orderCount: s?.orders ?? 0, totalSpent: s?.totalSpent ?? 0 }, recentOrders };
}

/** Deactivated customers cannot log in, and their existing sessions stop working on the next request. Admins cannot be deactivated here. */
export async function setCustomerActive(id: string, isActive: boolean) {
  const customer = await User.findOneAndUpdate({ _id: id, role: "customer" }, { isActive }, { new: true }).select(PUBLIC_FIELDS).lean();
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}
