export interface RankRow { name: string; value: number; valueText: string; note?: string }

/** Ranked horizontal bars in one hue: the name on top, the figure at the right, the bar scaled to the largest row. */
export function RankList({ rows, ariaLabel, emptyText }: { rows: RankRow[]; ariaLabel: string; emptyText: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (rows.length === 0 || max === 0) return <p className="flex h-40 items-center justify-center text-sm text-stone">{emptyText}</p>;
  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {rows.map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.name}</span>
            <span className="shrink-0 tabular-nums text-stone">{r.valueText}{r.note && <span className="text-xs"> ({r.note})</span>}</span>
          </div>
          <div className="h-3 bg-sand/50" aria-hidden>
            <div className="h-full rounded-r-[4px]" style={{ width: `${r.value === 0 ? 0 : Math.max(2, (r.value / max) * 100)}%`, background: "var(--viz-series)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
