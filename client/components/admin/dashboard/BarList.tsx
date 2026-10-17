import { formatPrice } from "@/lib/format";

/** Ranked horizontal bars (one hue; the name sits on the axis, the value at the bar tip). */
export function BarList({ rows, emptyText }: { rows: Array<{ name: string; revenue: number; units: number }>; emptyText: string }) {
  if (rows.length === 0) return <p className="flex h-40 items-center justify-center text-sm text-stone">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.revenue));
  return (
    <ul className="space-y-3" aria-label="Sales by category">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-stone">{formatPrice(r.revenue)} <span className="text-xs">({r.units} item{r.units === 1 ? "" : "s"})</span></span>
          </div>
          <div className="h-3 bg-sand/50" aria-hidden>
            <div className="h-full rounded-r-[4px]" style={{ width: `${Math.max(2, (r.revenue / max) * 100)}%`, background: "var(--viz-series)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
