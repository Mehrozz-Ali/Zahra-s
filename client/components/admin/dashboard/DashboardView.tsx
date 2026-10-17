"use client";

import { AlertTriangle, Clock, Package, Receipt, Users, Wallet } from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { dayLabel, monthLabel, monthLabelLong } from "@/lib/chart";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { useGetDashboardQuery } from "@/services/adminApi";
import { BarList } from "./BarList";
import { ChartCard } from "./ChartCard";
import { StatCard } from "./StatCard";
import { TimeChart } from "./TimeChart";

const n = (v: number) => v.toLocaleString("en-PK");

export function DashboardView() {
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardQuery(undefined, { refetchOnMountOrArgChange: true });

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading dashboard" className="animate-pulse space-y-6 motion-reduce:animate-none">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 bg-sand/60" />)}</div>
        <div className="grid gap-6 lg:grid-cols-2"><div className="h-72 bg-sand/60" /><div className="h-72 bg-sand/60" /></div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <p role="alert" className="bg-red-50 p-5 text-red-800">
        {getErrorMessage(error, "The dashboard could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button>
      </p>
    );
  }

  const { cards } = data;
  const dailyRevenue = data.daily.map((d) => ({ label: dayLabel(d.date), tooltipLabel: dayLabel(d.date), value: d.revenue }));
  const dailyOrders = data.daily.map((d) => ({ label: dayLabel(d.date), tooltipLabel: dayLabel(d.date), value: d.orders }));
  const monthly = data.monthly.map((m) => ({ label: monthLabel(m.month), tooltipLabel: monthLabelLong(m.month), value: m.revenue }));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Dashboard</h1>
          <p className="text-sm text-stone">Revenue counts paid card orders and delivered cash orders. Cancelled orders are left out.</p>
        </div>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="shrink-0 text-sm underline underline-offset-4 hover:text-rose-dark disabled:opacity-60">{isFetching ? "Refreshing..." : "Refresh"}</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total revenue" value={formatPrice(cards.totalRevenue)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Total orders" value={n(cards.totalOrders)} note="Excluding cancelled" icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Total customers" value={n(cards.totalCustomers)} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Total products" value={n(cards.totalProducts)} note="Excluding archived" icon={<Package className="h-5 w-5" />} />
        <StatCard label="Pending orders" value={n(cards.pendingOrders)} note="Waiting to be confirmed" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Low stock products" value={n(cards.lowStockProducts)} note={`${cards.lowStockThreshold} or fewer left, plus ${n(cards.outOfStockProducts)} sold out`} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Revenue" subtitle={`Last 30 days: ${formatPrice(sum(data.daily.map((d) => d.revenue)))}`} table={{ head: ["Day", "Revenue"], rows: data.daily.map((d) => [dayLabel(d.date), formatPrice(d.revenue)]) }}>
          <TimeChart kind="line" points={dailyRevenue} formatValue={formatPrice} ariaLabel="Daily revenue for the last 30 days" emptyText="No revenue in the last 30 days yet." />
        </ChartCard>
        <ChartCard title="Orders" subtitle={`Last 30 days: ${n(sum(data.daily.map((d) => d.orders)))} placed`} table={{ head: ["Day", "Orders"], rows: data.daily.map((d) => [dayLabel(d.date), n(d.orders)]) }}>
          <TimeChart kind="column" points={dailyOrders} formatValue={(v) => `${n(v)} order${v === 1 ? "" : "s"}`} ariaLabel="Orders placed per day for the last 30 days" emptyText="No orders in the last 30 days yet." />
        </ChartCard>
        <ChartCard title="Monthly sales" subtitle="Revenue per month, last 12 months" table={{ head: ["Month", "Revenue", "Orders"], rows: data.monthly.map((m) => [monthLabelLong(m.month), formatPrice(m.revenue), n(m.orders)]) }}>
          <TimeChart kind="column" points={monthly} formatValue={formatPrice} ariaLabel="Revenue per month for the last 12 months" emptyText="No sales in the last 12 months yet." />
        </ChartCard>
        <ChartCard title="Sales by category" subtitle="Items sold before discounts, top 8" table={{ head: ["Category", "Sales", "Items"], rows: data.salesByCategory.map((c) => [c.name, formatPrice(c.revenue), n(c.units)]) }}>
          <BarList rows={data.salesByCategory} emptyText="No category sales yet." />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="recent-heading" className="min-w-0 border border-sand bg-white p-5">
          <h2 id="recent-heading" className="mb-3 font-display text-2xl">Recent orders</h2>
          {data.recentOrders.length === 0 ? <p className="text-sm text-stone">No orders yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead><tr className="text-stone"><th scope="col" className="pb-2 font-normal">Order</th><th scope="col" className="pb-2 font-normal">Customer</th><th scope="col" className="pb-2 font-normal">Status</th><th scope="col" className="pb-2 text-right font-normal">Total</th></tr></thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o._id} className="border-t border-sand/60">
                      <td className="py-2"><span className="font-medium">{o.orderNumber}</span><span className="block text-xs text-stone">{formatDate(o.createdAt)}</span></td>
                      <td className="py-2">{o.customerName}</td>
                      <td className="py-2"><StatusBadge status={o.orderStatus} /></td>
                      <td className="py-2 text-right tabular-nums">{formatPrice(o.total)}<span className="block text-xs text-stone">{o.paymentMethod === "cod" ? "Cash" : "Card"}, {o.paymentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="low-heading" className="min-w-0 border border-sand bg-white p-5">
          <h2 id="low-heading" className="mb-3 font-display text-2xl">Needs restocking</h2>
          {data.lowStock.length === 0 ? <p className="text-sm text-stone">Everything is well stocked.</p> : (
            <ul className="divide-y divide-sand/60">
              {data.lowStock.map((p) => (
                <li key={p._id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="relative block h-12 w-9 shrink-0 overflow-hidden bg-sand">{p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className={p.totalStock === 0 ? "shrink-0 font-medium text-red-800" : "shrink-0 text-amber-900"}>{p.totalStock === 0 ? "Sold out" : `${p.totalStock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
