import type { AdminCustomerDetail, AnalyticsData, AnalyticsRange, AdminCustomerList, AdminOrderDetail, AdminOrderList, AdminOrderListParams, ApiSuccess, DashboardData, OrderStatus } from "@/types";
import { api } from "./api";

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, void>({
      query: () => "/admin/dashboard",
      transformResponse: (r: ApiSuccess<DashboardData>) => r.data,
      // Orders, reviews and stock all change these numbers, so any of their tags refreshes the dashboard
      providesTags: ["Order", "Product", "Review"],
    }),
    getAnalytics: builder.query<AnalyticsData, AnalyticsRange>({
      query: (range) => ({ url: "/admin/analytics", params: { range } }),
      transformResponse: (r: ApiSuccess<AnalyticsData>) => r.data,
      providesTags: ["Order", "Customer"],
    }),
    getAdminOrders: builder.query<AdminOrderList, AdminOrderListParams>({
      query: ({ page, ...filters }) => ({ url: "/admin/orders", params: { page, limit: 15, ...filters } }),
      transformResponse: (r: ApiSuccess<AdminOrderList>) => r.data,
      providesTags: ["Order"],
    }),
    getAdminOrder: builder.query<AdminOrderDetail, string>({
      query: (id) => `/admin/orders/${id}`,
      transformResponse: (r: ApiSuccess<AdminOrderDetail>) => r.data,
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation<AdminOrderDetail & { message: string }, { id: string; status: OrderStatus; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/orders/${id}/status`, method: "PATCH", body }),
      transformResponse: (r: ApiSuccess<AdminOrderDetail>) => ({ ...r.data, message: r.message }),
      // A cancellation puts stock back, so product numbers change too
      invalidatesTags: ["Order", "Product", "Coupon", "Customer"],
    }),
    getAdminCustomers: builder.query<AdminCustomerList, { page: number; q?: string; status: string }>({
      query: ({ page, q, status }) => ({ url: "/admin/customers", params: { page, limit: 15, status, ...(q ? { q } : {}) } }),
      transformResponse: (r: ApiSuccess<AdminCustomerList>) => r.data,
      providesTags: ["Customer"],
    }),
    getAdminCustomer: builder.query<AdminCustomerDetail, string>({
      query: (id) => `/admin/customers/${id}`,
      transformResponse: (r: ApiSuccess<AdminCustomerDetail>) => r.data,
      providesTags: ["Customer", "Order"],
    }),
    setCustomerActive: builder.mutation<string, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/admin/customers/${id}/status`, method: "PATCH", body: { isActive } }),
      transformResponse: (r: ApiSuccess<unknown>) => r.message,
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useGetDashboardQuery, useGetAnalyticsQuery, useGetAdminOrdersQuery, useGetAdminOrderQuery, useUpdateOrderStatusMutation,
  useGetAdminCustomersQuery, useGetAdminCustomerQuery, useSetCustomerActiveMutation,
} = adminApi;
