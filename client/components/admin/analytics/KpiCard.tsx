import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { KpiPair } from "@/types";

/**
 * A headline number with how it compares to the previous period of the same length.
 * `points` shows the change in percentage points (for rates) instead of a percent.
 */
export function KpiCard({ label, pair, format, previousLabel, points }: { label: string; pair: KpiPair; format: (v: number) => string; previousLabel: string; points?: boolean }) {
  const { current, previous } = pair;
  const diff = current - previous;
  let change: string;
  if (previous === 0 && current === 0) change = "Nothing in either period";
  else if (diff === 0) change = `Same as ${previousLabel}`;
  else if (points) change = `${Math.abs(Math.round(diff * 10) / 10)} points ${diff > 0 ? "higher" : "lower"} than ${previousLabel}`;
  else if (previous === 0) change = `New, nothing in ${previousLabel}`;
  else change = `${Math.abs(Math.round((diff / previous) * 100))}% ${diff > 0 ? "up" : "down"} on ${previousLabel}`;
  const Icon = diff === 0 ? Minus : diff > 0 ? ArrowUp : ArrowDown;

  return (
    <div className="min-w-0 border border-sand bg-white p-5">
      <p className="text-sm text-stone">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none tabular-nums">{format(current)}</p>
      <p className="mt-2 flex items-start gap-1 text-xs text-stone"><Icon className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /><span>{change}</span></p>
    </div>
  );
}
