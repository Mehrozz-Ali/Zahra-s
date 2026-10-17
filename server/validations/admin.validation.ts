import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../types";

const page = z.coerce.number().int().min(1).default(1);

export const adminOrdersQuerySchema = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional().transform((v) => v || undefined),
});

export const adminCustomersQuerySchema = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const updateCustomerStatusSchema = z.object({ isActive: z.boolean() });

export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AdminCustomersQuery = z.infer<typeof adminCustomersQuerySchema>;

export const ANALYTICS_RANGES = ["7d", "30d", "90d", "12m"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const adminAnalyticsQuerySchema = z.object({
  range: z.enum(ANALYTICS_RANGES).default("30d"),
});
export type AdminAnalyticsQuery = z.infer<typeof adminAnalyticsQuerySchema>;
