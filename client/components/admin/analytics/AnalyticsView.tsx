"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { ChartCard } from "@/components/admin/dashboard/ChartCard";
import { TimeChart } from "@/components/admin/dashboard/TimeChart";
import { dayLabel, monthLabel, monthLabelLong } from "@/lib/chart";
import { getErrorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { useGetAnalyticsQuery } from "@/services/adminApi";
import type { AnalyticsRange } from "@/types";
import { KpiCard } from "./KpiCard";
import { RankList } from "./RankList";

const RANGES: Array<{ value: AnalyticsRange; label: string; long: string }> = [
  { value: "7d", label: "7 days", long: "the last 7 days" },
  { value: "30d", label: "30 days", long: "the last 30 days" },
  { value: "90d", label: "90 days", long: "the last 90 days" },
  { value: "12m", label: "12 months", long: "the last 12 months" },
];
const n = (v: number) => v.toLocaleString("en-PK");
const plural = (v: number, word: string) => `${n(v)} ${word}${v === 1 ? "" : "s"}`;
const pk = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" });
const STATUS_LABEL: Record<string, string> = { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

export function AnalyticsView() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, isLoading, isFetching, error, refetch } = useGetAnalyticsQuery(range, { refetchOnMountOrArgChange: true });
  const r = RANGES.find((x) => x.value === range)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl">Analytics</h1>
          <p className="text-sm text-stone">{data ? `${pk(data.from)} to today. ` : ""}Revenue counts paid card orders and delivered cash orders. Cancelled orders are left out of sales.</p>
        </div>
        <div role="group" aria-label="Time range" className="flex gap-1">
          {RANGES.map((x) => (
            <button key={x.value} type="button" aria-pressed={range === x.value} onClick={() => setRange(x.value)} className={clsx("px-3 py-1.5 text-sm", range === x.value ? "bg-ink text-ivory" : "bg-white hover:bg-sand/60")}>{x.label}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div role="status" aria-label="Loading analytics" className="animate-pulse space-y-6 motion-reduce:animate-none">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 bg-sand/60" />)}</div>
          <div className="grid gap-6 lg:grid-cols-2"><div className="h-72 bg-sand/60" /><div className="h-72 bg-sand/60" /></div>
        </div>
      ) : error || !data ? (
        <p role="alert" className="bg-red-50 p-5 text-red-800">{getErrorMessage(error, "Analytics could not be loaded.")} <button type="button" onClick={() => refetch()} className="underline underline-offset-4">Try again</button></p>
      ) : (() => {
        const { kpis } = data;
        const prev = range === "12m" ? "the previous 12 months" : `the previous ${r.label}`;
        const label = (key: string) => (data.bucket === "day" ? dayLabel(key) : monthLabel(key));
        const longLabel = (key: string) => (data.bucket === "day" ? dayLabel(key) : monthLabelLong(key));
        const per = data.bucket === "day" ? "day" : "month";
        const revenuePoints = data.series.map((s) => ({ label: label(s.key), tooltipLabel: longLabel(s.key), value: s.revenue }));
        const orderPoints = data.series.map((s) => ({ label: label(s.key), tooltipLabel: longLabel(s.key), value: s.orders }));
        const totalOrders = data.statuses.reduce((a, s) => a + s.count, 0);
        const payName = (m: string) => (m === "cod" ? "Cash on delivery" : "Card");
        const buyers = data.customers;

        return (
          <div className={clsx("space-y-6", isFetching && "opacity-70")} aria-busy={isFetching}>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <KpiCard label="Revenue" pair={kpis.revenue} format={formatPrice} previousLabel={prev} />
              <KpiCard label="Orders placed" pair={kpis.orders} format={n} previousLabel={prev} />
              <KpiCard label="Average order value" pair={kpis.averageOrderValue} format={formatPrice} previousLabel={prev} />
              <KpiCard label="Items sold" pair={kpis.unitsSold} format={n} previousLabel={prev} />
              <KpiCard label="New customers" pair={kpis.newCustomers} format={n} previousLabel={prev} />
              <KpiCard label="Cancellation rate" pair={kpis.cancellationRate} format={(v) => `${v}%`} previousLabel={prev} points />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-2">
              <ChartCard title="Revenue" subtitle={`${formatPrice(kpis.revenue.current)} in ${r.long}`} table={{ head: [data.bucket === "day" ? "Day" : "Month", "Revenue", "Orders"], rows: data.series.map((s) => [longLabel(s.key), formatPrice(s.revenue), n(s.orders)]) }}>
                <TimeChart kind={data.bucket === "day" ? "line" : "column"} points={revenuePoints} formatValue={formatPrice} ariaLabel={`Revenue per ${per} for ${r.long}`} emptyText={`No revenue in ${r.long} yet.`} />
              </ChartCard>
              <ChartCard title="Orders" subtitle={`${plural(kpis.orders.current, "order")} placed in ${r.long}`} table={{ head: [data.bucket === "day" ? "Day" : "Month", "Orders"], rows: data.series.map((s) => [longLabel(s.key), n(s.orders)]) }}>
                <TimeChart kind="column" points={orderPoints} formatValue={(v) => plural(v, "order")} ariaLabel={`Orders placed per ${per} for ${r.long}`} emptyText={`No orders in ${r.long} yet.`} />
              </ChartCard>

              <ChartCard title="Best sellers" subtitle="Top 8 articles by sales, before discounts" table={{ head: ["Article", "Sales", "Items"], rows: data.topProducts.map((p) => [p.name, formatPrice(p.revenue), n(p.units)]) }}>
                {data.topProducts.length === 0 ? <p className="flex h-40 items-center justify-center text-sm text-stone">No sales in {r.long} yet.</p> : (
                  <ol className="space-y-3" aria-label="Best selling articles">
                    {data.topProducts.map((p) => {
                      const max = data.topProducts[0]!.revenue || 1;
                      return (
                        <li key={p.productId} className="flex items-center gap-3">
                          <span className="relative block h-12 w-9 shrink-0 overflow-hidden bg-sand">{p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate">{p.name}</span><span className="shrink-0 tabular-nums text-stone">{formatPrice(p.revenue)} <span className="text-xs">({plural(p.units, "item")})</span></span></div>
                            <div className="mt-1 h-2.5 bg-sand/50" aria-hidden><div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(2, (p.revenue / max) * 100)}%`, background: "var(--viz-series)" }} /></div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </ChartCard>
              <ChartCard title="Sales by category" subtitle="Top 8, before discounts" table={{ head: ["Category", "Sales", "Items"], rows: data.categories.map((c) => [c.name, formatPrice(c.revenue), n(c.units)]) }}>
                <RankList ariaLabel="Sales by category" emptyText={`No sales in ${r.long} yet.`} rows={data.categories.map((c) => ({ name: c.name, value: c.revenue, valueText: formatPrice(c.revenue), note: plural(c.units, "item") }))} />
              </ChartCard>

              <ChartCard title="Payment method" subtitle="Orders placed, and revenue earned so far" table={{ head: ["Method", "Orders", "Revenue"], rows: data.paymentMethods.map((p) => [payName(p.method), n(p.orders), formatPrice(p.revenue)]) }}>
                <RankList ariaLabel="Orders by payment method" emptyText={`No orders in ${r.long} yet.`} rows={data.paymentMethods.map((p) => ({ name: payName(p.method), value: p.orders, valueText: plural(p.orders, "order"), note: formatPrice(p.revenue) }))} />
              </ChartCard>
              <ChartCard title="Order status" subtitle={`All ${plural(totalOrders, "order")} placed in ${r.long}, including cancelled`} table={{ head: ["Status", "Orders"], rows: data.statuses.map((s) => [STATUS_LABEL[s.status] ?? s.status, n(s.count)]) }}>
                <RankList ariaLabel="Orders by status" emptyText={`No orders in ${r.long} yet.`} rows={data.statuses.map((s) => ({ name: STATUS_LABEL[s.status] ?? s.status, value: s.count, valueText: plural(s.count, "order") }))} />
              </ChartCard>

              <ChartCard title="Where orders go: provinces" subtitle="Orders placed, not cancelled" table={{ head: ["Province", "Orders", "Revenue"], rows: data.provinces.map((p) => [p.name, n(p.orders), formatPrice(p.revenue)]) }}>
                <RankList ariaLabel="Orders by province" emptyText={`No orders in ${r.long} yet.`} rows={data.provinces.map((p) => ({ name: p.name, value: p.orders, valueText: plural(p.orders, "order"), note: formatPrice(p.revenue) }))} />
              </ChartCard>
              <ChartCard title="Where orders go: cities" subtitle="Top 8 cities by orders placed" table={{ head: ["City", "Orders", "Revenue"], rows: data.cities.map((c) => [c.name, n(c.orders), formatPrice(c.revenue)]) }}>
                <RankList ariaLabel="Orders by city" emptyText={`No orders in ${r.long} yet.`} rows={data.cities.map((c) => ({ name: c.name, value: c.orders, valueText: plural(c.orders, "order"), note: formatPrice(c.revenue) }))} />
              </ChartCard>

              <ChartCard title="Returning customers" subtitle={`${plural(buyers.buyers, "customer")} ordered in ${r.long}`} table={{ head: ["Customers", "Count"], rows: [["First order in this period", n(buyers.firstTime)], ["Ordered before this period", n(buyers.returning)]] }}>
                <RankList ariaLabel="Customers who ordered, new and returning" emptyText={`No customers ordered in ${r.long} yet.`} rows={[
                  { name: "Ordering for the first time", value: buyers.firstTime, valueText: plural(buyers.firstTime, "customer") },
                  { name: "Ordered before this period", value: buyers.returning, valueText: plural(buyers.returning, "customer") },
                ]} />
              </ChartCard>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
