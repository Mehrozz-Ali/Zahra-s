"use client";

import { useId, useState } from "react";
import { compact, niceScale } from "@/lib/chart";

export interface ChartPoint { label: string; tooltipLabel: string; value: number }

interface TimeChartProps {
  kind: "line" | "column";
  points: ChartPoint[];
  formatValue: (v: number) => string;
  ariaLabel: string;
  emptyText: string;
}

// Text is sized for the chart being scaled down to ~300-480px wide, so it still lands at roughly 11px on screen
const W = 640, H = 240, M = { l: 58, r: 14, t: 16, b: 34 };
const FONT = 15;
const PW = W - M.l - M.r, PH = H - M.t - M.b;

/**
 * One series over time, as a 2px line (with a ~10% wash) or as columns.
 * Marks follow the data-viz spec: thin, 4px rounded data ends on columns, a surface ring on the end marker,
 * hairline grid, one axis, text in text colours (never the series colour). Hover/focus shows exact values.
 */
export function TimeChart({ kind, points, formatValue, ariaLabel, emptyText }: TimeChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(0, ...points.map((p) => p.value));
  if (max === 0) return <p className="flex h-40 items-center justify-center text-sm text-stone">{emptyText}</p>;

  const { top, ticks } = niceScale(max);
  const n = points.length;
  const slot = PW / n;
  const x = (i: number) => M.l + slot * i + slot / 2;
  const y = (v: number) => M.t + PH - (v / top) * PH;
  const labelStep = Math.ceil(n / 5); // fewer labels so they never touch
  const barW = Math.min(24, slot * 0.7);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)} ${(M.t + PH).toFixed(1)} L${x(0).toFixed(1)} ${(M.t + PH).toFixed(1)} Z`;
  const a = active === null ? null : points[active];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={ariaLabel} onPointerLeave={() => setActive(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--color-sand)" strokeWidth={1} />
            <text x={M.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={FONT} fill="var(--color-stone)">{compact(t)}</text>
          </g>
        ))}
        {points.map((p, i) => (i % labelStep === 0 || i === n - 1) && (n - 1 - i >= labelStep * 0.6 || i === n - 1) ? (
          <text key={p.label + i} x={x(i)} y={H - 9} textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize={FONT} fill="var(--color-stone)">{p.label}</text>
        ) : null)}

        {kind === "line" ? (
          <>
            <path d={areaPath} fill="var(--viz-series)" opacity={0.1} />
            <path d={linePath} fill="none" stroke="var(--viz-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {active !== null && <line x1={x(active)} x2={x(active)} y1={M.t} y2={M.t + PH} stroke="var(--color-stone)" strokeWidth={1} opacity={0.5} />}
            {/* end marker: >= 8px with a 2px surface ring; moves to the hovered point */}
            <circle cx={x(active ?? n - 1)} cy={y(points[active ?? n - 1].value)} r={5} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
          </>
        ) : (
          points.map((p, i) => {
            const h = Math.max(0, (p.value / top) * PH);
            if (h === 0) return null;
            const r = Math.min(4, h, barW / 2);
            const x0 = x(i) - barW / 2, y0 = y(p.value), x1 = x0 + barW, yb = M.t + PH;
            // 4px rounded data end (top), square at the baseline
            const d = `M${x0} ${yb} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 + r} V${yb} Z`;
            return <path key={p.label + i} d={d} fill="var(--viz-series)" opacity={active === null || active === i ? 1 : 0.45} />;
          })
        )}

        {/* hit targets are full-height slots, much larger than the marks */}
        {points.map((p, i) => (
          <rect
            key={p.label + i} x={M.l + slot * i} y={M.t} width={slot} height={PH} fill="transparent" tabIndex={0}
            aria-label={`${p.tooltipLabel}: ${formatValue(p.value)}`}
            onPointerEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
            className="outline-none focus-visible:stroke-[var(--color-rose-dark)] focus-visible:[stroke-width:2px]"
          />
        ))}
      </svg>
      {a && active !== null && (
        <div
          id={`${id}-tip`} role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap border border-sand bg-white px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${Math.min(88, Math.max(12, (x(active) / W) * 100))}%`, top: 0 }}
        >
          <span className="block text-stone">{a.tooltipLabel}</span>
          <span className="block text-sm font-medium tabular-nums">{formatValue(a.value)}</span>
        </div>
      )}
    </div>
  );
}
