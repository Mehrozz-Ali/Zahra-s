import * as analytics from "../services/analytics.service";
import * as customers from "../services/admin-customer.service";
import * as orders from "../services/admin-order.service";
import * as dashboardService from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/sendResponse";
import type { AdminAnalyticsQuery, AdminCustomersQuery, AdminOrdersQuery, UpdateOrderStatusInput } from "../validations/admin.validation";

export const getDashboard = asyncHandler(async (_req, res) => {
  sendSuccess(res, await dashboardService.getDashboard(), "Dashboard fetched successfully");
});

export const getAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, await analytics.getAnalytics((req.query as unknown as AdminAnalyticsQuery).range), "Analytics fetched successfully");
});

export const listOrders = asyncHandler(async (req, res) => {
  sendSuccess(res, await orders.listAdminOrders(req.query as unknown as AdminOrdersQuery), "Orders fetched successfully");
});
export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orders.getAdminOrder(String(req.params.id)), "Order fetched successfully");
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { order, refundFailed } = await orders.updateOrderStatus(String(req.params.id), req.body as UpdateOrderStatusInput);
  const message = refundFailed ? "Order cancelled, but the automatic refund failed. Please refund the payment in Stripe." : `Order marked as ${order.orderStatus}`;
  sendSuccess(res, { ...(await orders.getAdminOrder(String(order._id))), refundFailed }, message);
});

export const listCustomers = asyncHandler(async (req, res) => {
  sendSuccess(res, await customers.listCustomers(req.query as unknown as AdminCustomersQuery), "Customers fetched successfully");
});
export const getCustomer = asyncHandler(async (req, res) => {
  sendSuccess(res, await customers.getCustomer(String(req.params.id)), "Customer fetched successfully");
});
export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await customers.setCustomerActive(String(req.params.id), (req.body as { isActive: boolean }).isActive);
  sendSuccess(res, { customer }, customer.isActive ? "Customer activated" : "Customer deactivated");
});
